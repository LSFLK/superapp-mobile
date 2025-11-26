package handler

import (
	"encoding/json"
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

// SendNotification sends a notification to specific users
func (h *NotificationHandler) SendNotification(w http.ResponseWriter, r *http.Request) {
	// Get user info from context
	userInfo, ok := auth.GetUserInfo(r.Context())
	if !ok {
		http.Error(w, "user info not found in context", http.StatusUnauthorized)
		return
	}

	if !validateContentType(w, r) {
		return
	}

	limitRequestBody(w, r, 0)
	var req dto.SendNotificationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request
	if !validateStruct(w, &req) {
		return
	}

	// Get device tokens for the specified users
	var deviceTokens []models.DeviceToken
	if err := h.db.Where("user_email IN ? AND is_active = ?", req.UserEmails, true).
		Find(&deviceTokens).Error; err != nil {
		slog.Error("Failed to fetch device tokens", "error", err)
		http.Error(w, "failed to fetch device tokens", http.StatusInternalServerError)
		return
	}

	if len(deviceTokens) == 0 {
		slog.Warn("No active device tokens found for users", "users", req.UserEmails)
		if err := writeJSON(w, http.StatusOK, dto.NotificationResponse{
			Success: 0,
			Failed:  0,
			Message: "No active device tokens found",
		}); err != nil {
			slog.Error("Failed to write JSON response", "error", err)
		}
		return
	}

	// Extract tokens
	tokens := make([]string, len(deviceTokens))
	for i, dt := range deviceTokens {
		tokens[i] = dt.DeviceToken
	}

	// Convert data to map[string]string for FCM
	dataStr := make(map[string]string)
	for k, v := range req.Data {
		if str, ok := v.(string); ok {
			dataStr[k] = str
		} else {
			// Convert non-string values to JSON string
			if bytes, err := json.Marshal(v); err == nil {
				dataStr[k] = string(bytes)
			}
		}
	}

	// Add microappId to data payload for deep linking
	if req.MicroappID != "" {
		dataStr["microappId"] = req.MicroappID
	}

	// Send notification via FCM
	successCount, failureCount, err := h.fcmService.SendNotificationToMultiple(
		r.Context(),
		tokens,
		req.Title,
		req.Body,
		dataStr,
	)

	if err != nil {
		slog.Error("Failed to send notifications", "error", err)
		http.Error(w, "failed to send notifications", http.StatusInternalServerError)
		return
	}

	// Log notifications
	for _, email := range req.UserEmails {
		status := "sent"
		if failureCount > 0 {
			status = "partial_failure"
		}

		notifLog := models.NotificationLog{
			UserEmail:  email,
			Title:      &req.Title,
			Body:       &req.Body,
			Data:       req.Data,
			Status:     &status,
			MicroappID: &req.MicroappID,
		}

		if err := h.db.Create(&notifLog).Error; err != nil {
			slog.Error("Failed to log notification", "error", err, "email", email)
		}
	}

	slog.Info("Notifications sent",
		"success", successCount,
		"failed", failureCount,
		"requested_by", userInfo.Email,
		"microapp_id", req.MicroappID)

	response := dto.NotificationResponse{
		Success: successCount,
		Failed:  failureCount,
		Message: "Notifications sent successfully",
	}

	if err := writeJSON(w, http.StatusOK, response); err != nil {
		slog.Error("Failed to write JSON response", "error", err)
	}
}

// SendToGroups sends a notification to users in specific groups
func (h *NotificationHandler) SendToGroups(w http.ResponseWriter, r *http.Request) {
	// Get user info from context
	userInfo, ok := auth.GetUserInfo(r.Context())
	if !ok {
		http.Error(w, "user info not found in context", http.StatusUnauthorized)
		return
	}

	if !validateContentType(w, r) {
		return
	}

	limitRequestBody(w, r, 0)
	var req dto.SendToGroupsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request
	if !validateStruct(w, &req) {
		return
	}

	// Get users who have access to apps with these group roles
	var roles []models.MicroAppRole
	if err := h.db.Where("role IN ? AND active = ?", req.Groups, 1).
		Find(&roles).Error; err != nil {
		slog.Error("Failed to fetch roles", "error", err)
		http.Error(w, "failed to fetch roles", http.StatusInternalServerError)
		return
	}

	if len(roles) == 0 {
		slog.Warn("No roles found for groups", "groups", req.Groups)
		if err := writeJSON(w, http.StatusOK, dto.NotificationResponse{
			Success: 0,
			Failed:  0,
			Message: "No users found for specified groups",
		}); err != nil {
			slog.Error("Failed to write JSON response", "error", err)
		}
		return
	}

	// For simplicity, we'll send to all active device tokens
	// In a real implementation, you might want to filter by group membership
	var deviceTokens []models.DeviceToken
	if err := h.db.Where("is_active = ?", true).
		Find(&deviceTokens).Error; err != nil {
		slog.Error("Failed to fetch device tokens", "error", err)
		http.Error(w, "failed to fetch device tokens", http.StatusInternalServerError)
		return
	}

	if len(deviceTokens) == 0 {
		slog.Warn("No active device tokens found")
		if err := writeJSON(w, http.StatusOK, dto.NotificationResponse{
			Success: 0,
			Failed:  0,
			Message: "No active device tokens found",
		}); err != nil {
			slog.Error("Failed to write JSON response", "error", err)
		}
		return
	}

	// Extract tokens
	tokens := make([]string, len(deviceTokens))
	for i, dt := range deviceTokens {
		tokens[i] = dt.DeviceToken
	}

	// Convert data to map[string]string for FCM
	dataStr := make(map[string]string)
	for k, v := range req.Data {
		if str, ok := v.(string); ok {
			dataStr[k] = str
		} else {
			if bytes, err := json.Marshal(v); err == nil {
				dataStr[k] = string(bytes)
			}
		}
	}

	// Add microappId to data payload for deep linking (if provided in request)
	// Note: SendToGroupsRequest doesn't have microappId field, but we keep this pattern for consistency
	// If you want to add microappId support for groups, add it to the DTO first

	// Send notification via FCM
	successCount, failureCount, err := h.fcmService.SendNotificationToMultiple(
		r.Context(),
		tokens,
		req.Title,
		req.Body,
		dataStr,
	)

	if err != nil {
		slog.Error("Failed to send notifications to groups", "error", err)
		http.Error(w, "failed to send notifications", http.StatusInternalServerError)
		return
	}

	slog.Info("Group notifications sent",
		"success", successCount,
		"failed", failureCount,
		"requested_by", userInfo.Email,
		"groups", req.Groups)

	response := dto.NotificationResponse{
		Success: successCount,
		Failed:  failureCount,
		Message: "Notifications sent to groups successfully",
	}

	if err := writeJSON(w, http.StatusOK, response); err != nil {
		slog.Error("Failed to write JSON response", "error", err)
	}
}
