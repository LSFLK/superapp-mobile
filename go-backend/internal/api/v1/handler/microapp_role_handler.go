package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"go-backend/internal/api/v1/dto"
	"go-backend/internal/auth"
	"go-backend/internal/models"

	"github.com/go-chi/chi/v5"
	"gorm.io/gorm"
)

type MicroAppRoleHandler struct {
	db *gorm.DB
}

func NewMicroAppRoleHandler(db *gorm.DB) *MicroAppRoleHandler {
	return &MicroAppRoleHandler{db: db}
}

// UpsertRole handles creating or updating a role for a micro app
func (h *MicroAppRoleHandler) UpsertRole(w http.ResponseWriter, r *http.Request) {
	// Get user info from context (set by auth middleware)
	userInfo, ok := auth.GetUserInfo(r.Context())
	if !ok {
		http.Error(w, "user info not found in context", http.StatusUnauthorized)
		return
	}
	userEmail := userInfo.Email

	appID := chi.URLParam(r, "appID")
	if appID == "" {
		http.Error(w, "missing micro_app_id", http.StatusBadRequest)
		return
	}

	var microApp models.MicroApp
	if err := h.db.Where("micro_app_id = ?", appID).First(&microApp).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			http.Error(w, "micro app not found", http.StatusNotFound)
		} else {
			slog.Error("Failed to fetch micro app", "error", err, "appID", appID)
			http.Error(w, "failed to fetch micro app", http.StatusInternalServerError)
		}
		return
	}

	if !validateContentType(w, r) {
		return
	}

	limitRequestBody(w, r, 0) // 1MB default limit
	var req dto.CreateMicroAppRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if !validateRequiredStrings(w, map[string]string{
		"role": req.Role,
	}) {
		return
	}

	role := models.MicroAppRole{}
	result := h.db.Where("micro_app_id = ? AND role = ?", appID, req.Role).
		Assign(models.MicroAppRole{
			Active:    1,
			UpdatedBy: &userEmail,
		}).
		Attrs(models.MicroAppRole{
			MicroAppID: appID,
			Role:       req.Role,
			CreatedBy:  userEmail,
		}).FirstOrCreate(&role)

	if result.Error != nil {
		slog.Error("Failed to upsert role", "error", result.Error, "appID", appID, "role", req.Role)
		http.Error(w, "failed to upsert role", http.StatusInternalServerError)
		return
	}

	if err := writeJSON(w, http.StatusCreated, dto.MicroAppRoleResponse{
		ID:         role.ID,
		MicroAppID: role.MicroAppID,
		Role:       role.Role,
		Active:     role.Active,
	}); err != nil {
		slog.Error("Failed to write JSON response", "error", err)
		http.Error(w, "failed to write response", http.StatusInternalServerError)
	}
}
