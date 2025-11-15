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

type MicroAppVersionHandler struct {
	db *gorm.DB
}

func NewMicroAppVersionHandler(db *gorm.DB) *MicroAppVersionHandler {
	return &MicroAppVersionHandler{db: db}
}

// UpsertVersion handles creating or updating a version for a micro app
func (h *MicroAppVersionHandler) UpsertVersion(w http.ResponseWriter, r *http.Request) {
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
	var req dto.CreateMicroAppVersionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if !validateRequiredStrings(w, map[string]string{
		"version":     req.Version,
		"downloadUrl": req.DownloadURL,
	}) {
		return
	}
	if req.Build < 1 {
		http.Error(w, "build must be 1 or greater", http.StatusBadRequest)
		return
	}

	version := models.MicroAppVersion{}
	result := h.db.Where("micro_app_id = ? AND version = ? AND build = ?", appID, req.Version, req.Build).
		Assign(models.MicroAppVersion{
			ReleaseNotes: req.ReleaseNotes,
			IconURL:      req.IconURL,
			DownloadURL:  req.DownloadURL,
			Active:       1,
			UpdatedBy:    &userEmail,
		}).
		Attrs(models.MicroAppVersion{
			MicroAppID: appID,
			Version:    req.Version,
			Build:      req.Build,
			CreatedBy:  userEmail,
		}).FirstOrCreate(&version)

	if result.Error != nil {
		slog.Error("Failed to upsert version", "error", result.Error, "appID", appID, "version", req.Version, "build", req.Build)
		http.Error(w, "failed to upsert version", http.StatusInternalServerError)
		return
	}

	if err := writeJSON(w, http.StatusCreated, dto.MicroAppVersionResponse{
		ID:           version.ID,
		MicroAppID:   version.MicroAppID,
		Version:      version.Version,
		Build:        version.Build,
		ReleaseNotes: version.ReleaseNotes,
		IconURL:      version.IconURL,
		DownloadURL:  version.DownloadURL,
		Active:       version.Active,
	}); err != nil {
		slog.Error("Failed to write JSON response", "error", err)
		http.Error(w, "failed to write response", http.StatusInternalServerError)
	}
}
