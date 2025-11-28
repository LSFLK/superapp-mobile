package handler

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"go-backend/internal/api/v1/dto"
	"go-backend/internal/auth"
	"go-backend/internal/models"
	"go-backend/internal/services"

	"gorm.io/gorm"
)

type NotificationHandler struct {
	db         *gorm.DB
	fcmService *services.FCMService
}

func NewNotificationHandler(db *gorm.DB, fcmService *services.FCMService) *NotificationHandler {
	return &NotificationHandler{
		db:         db,
		fcmService: fcmService,
	}
}

// RegisterDeviceToken registers or updates a device token for push notifications
func (h *NotificationHandler) RegisterDeviceToken(w http.ResponseWriter, r *http.Request) {
	// Get user info from context
	userInfo, ok := auth.GetUserInfo(r.Context())
	if !ok {
		http.Error(w, "user info not found in context", http.StatusUnauthorized)
		return
	}

	if !validateContentType(w, r) {
		return
	}

	limitRequestBody(w, r, 0) // 1MB default
	var req dto.RegisterDeviceTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request
	if !validateStruct(w, &req) {
		return
	}

	// Verify email matches authenticated user
	if req.Email != userInfo.Email {
		http.Error(w, "email does not match authenticated user", http.StatusForbidden)
		return
	}

	// Upsert device token (unique on user_email + platform)
	deviceToken := models.DeviceToken{
		UserEmail:   req.Email,
		DeviceToken: req.Token,
		Platform:    req.Platform,
		IsActive:    true,
	}

	result := h.db.Where("user_email = ? AND platform = ?", req.Email, req.Platform).
		Assign(models.DeviceToken{
			DeviceToken: req.Token,
			IsActive:    true,
		}).
		FirstOrCreate(&deviceToken)

	if result.Error != nil {
		slog.Error("Failed to register device token", "error", result.Error, "email", req.Email)
		http.Error(w, "failed to register device token", http.StatusInternalServerError)
		return
	}

	slog.Info("Device token registered successfully", "email", req.Email, "platform", req.Platform)
	w.WriteHeader(http.StatusCreated)
}

func (h *NotificationHandler) getClientMicroappID(r *http.Request) (string, string, error) {
	serviceInfo, ok := auth.GetServiceInfo(r.Context())
	if !ok {
		return "", "", errors.New("service info not found in context")
	}

	if serviceInfo.ClientID == "" {
		slog.Warn("Client ID is empty in service info")
		return "", "", errors.New("client ID is empty")
	}

	// ClientID is the microapp ID
	return serviceInfo.ClientID, serviceInfo.ClientID, nil
}

func (h *NotificationHandler) prepareFCMData(data map[string]interface{}, microappID string) map[string]string {
	dataStr := make(map[string]string)
	for k, v := range data {
		if str, ok := v.(string); ok {
			dataStr[k] = str
		} else {
			if bytes, err := json.Marshal(v); err == nil {
				dataStr[k] = string(bytes)
			}
		}
	}

	if microappID != "" {
		dataStr["microappId"] = microappID
	}
	return dataStr
}

func (h *NotificationHandler) logNotifications(userEmails []string, title, body, microappID, status string, data map[string]interface{}) {
	for _, email := range userEmails {
		log := models.NotificationLog{
			UserEmail:  email,
			Title:      &title,
			Body:       &body,
			Data:       data,
			Status:     &status,
			MicroappID: &microappID,
		}
		if err := h.db.Create(&log).Error; err != nil {
			slog.Error("Failed to log notification", "error", err, "email", email)
		}
	}
}

// SendNotification sends a notification to specific users
func (h *NotificationHandler) SendNotification(w http.ResponseWriter, r *http.Request) {
	if !validateContentType(w, r) {
		return
	}

	limitRequestBody(w, r, 0)
	var req dto.SendNotificationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if !validateStruct(w, &req) {
		return
	}

	requestedBy, microappID, err := h.getClientMicroappID(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	var deviceTokens []models.DeviceToken
	if err := h.db.Where("user_email IN ? AND is_active = ?", req.UserEmails, true).Find(&deviceTokens).Error; err != nil {
		slog.Error("Failed to fetch device tokens", "error", err)
		http.Error(w, "failed to fetch device tokens", http.StatusInternalServerError)
		return
	}

	if len(deviceTokens) == 0 {
		slog.Warn("No active device tokens found for users", "users", req.UserEmails)
		writeJSON(w, http.StatusOK, dto.NotificationResponse{Success: 0, Failed: 0, Message: "No active device tokens found"})
		return
	}

	tokens := make([]string, len(deviceTokens))
	for i, dt := range deviceTokens {
		tokens[i] = dt.DeviceToken
	}

	dataStr := h.prepareFCMData(req.Data, microappID)

	successCount, failureCount, err := h.fcmService.SendNotificationToMultiple(r.Context(), tokens, req.Title, req.Body, dataStr)
	if err != nil {
		slog.Error("Failed to send notifications", "error", err)
		http.Error(w, "failed to send notifications", http.StatusInternalServerError)
		return
	}

	status := "sent"
	if failureCount > 0 {
		status = "partial_failure"
	}
	h.logNotifications(req.UserEmails, req.Title, req.Body, microappID, status, req.Data)

	slog.Info("Notifications sent", "success", successCount, "failed", failureCount, "requested_by", requestedBy, "microapp_id", microappID)

	response := dto.NotificationResponse{Success: successCount, Failed: failureCount, Message: "Notifications sent successfully"}
	writeJSON(w, http.StatusOK, response)
}
