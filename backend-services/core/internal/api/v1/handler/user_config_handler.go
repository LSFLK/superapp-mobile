package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"go-backend/internal/api/v1/dto"
	"go-backend/internal/auth"
	"go-backend/internal/models"

	"gorm.io/gorm"
)

type UserConfigHandler struct {
	db *gorm.DB
}

func NewUserConfigHandler(db *gorm.DB) *UserConfigHandler {
	return &UserConfigHandler{db: db}
}

// GetAppConfigs retrieves all active configurations for the logged-in user
func (h *UserConfigHandler) GetAppConfigs(w http.ResponseWriter, r *http.Request) {
	// Get user info from context (set by auth middleware)
	userInfo, ok := auth.GetUserInfo(r.Context())
	if !ok {
		http.Error(w, "user info not found in context", http.StatusUnauthorized)
		return
	}

	var configs []models.UserConfig
	if err := h.db.Where("email = ? AND active = ?", userInfo.Email, 1).Find(&configs).Error; err != nil {
		slog.Error("Failed to fetch user configs", "error", err, "email", userInfo.Email)
		http.Error(w, "failed to fetch user configurations", http.StatusInternalServerError)
		return
	}

	var response []dto.UserConfigResponse
	for _, config := range configs {
		response = append(response, dto.UserConfigResponse{
			Email:       config.Email,
			ConfigKey:   config.ConfigKey,
			ConfigValue: config.ConfigValue,
			Active:      config.Active,
		})
	}

	if err := writeJSON(w, http.StatusOK, response); err != nil {
		slog.Error("Failed to write JSON response", "error", err)
		http.Error(w, "failed to write response", http.StatusInternalServerError)
	}
}

// UpsertAppConfig creates or updates a user configuration
func (h *UserConfigHandler) UpsertAppConfig(w http.ResponseWriter, r *http.Request) {
	// Get user info from context (set by auth middleware)
	userInfo, ok := auth.GetUserInfo(r.Context())
	if !ok {
		http.Error(w, "user info not found in context", http.StatusUnauthorized)
		return
	}

	if !validateContentType(w, r) {
		return
	}

	limitRequestBody(w, r, 0) // 1MB default limit
	var req dto.UpsertUserConfigRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request
	if !validateStruct(w, &req) {
		return
	}

	if req.Active == 0 {
		req.Active = 1
	}

	config := models.UserConfig{}
	result := h.db.Where("email = ? AND config_key = ?", userInfo.Email, req.ConfigKey).
		Assign(models.UserConfig{
			ConfigValue: req.ConfigValue,
			Active:      req.Active,
			UpdatedBy:   userInfo.Email,
		}).
		Attrs(models.UserConfig{
			Email:       userInfo.Email,
			ConfigKey:   req.ConfigKey,
			ConfigValue: req.ConfigValue,
			CreatedBy:   userInfo.Email,
		}).FirstOrCreate(&config)

	if result.Error != nil {
		slog.Error("Failed to upsert user config", "error", result.Error, "email", userInfo.Email, "configKey", req.ConfigKey)
		http.Error(w, "failed to upsert user configuration", http.StatusInternalServerError)
		return
	}

	if err := writeJSON(w, http.StatusCreated, map[string]string{"message": "Configuration updated successfully"}); err != nil {
		slog.Error("Failed to write JSON response", "error", err)
		http.Error(w, "failed to write response", http.StatusInternalServerError)
	}
}
