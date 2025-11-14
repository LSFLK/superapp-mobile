package handler

import (
	"encoding/json"
	"fmt"
	"net/http"

	"go-backend/internal/api/v1/dto"
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

// MicroAppVersionHandler to handle creating a new version for a micro app
func (h *MicroAppVersionHandler) CreateVersion(w http.ResponseWriter, r *http.Request) {

	appID := chi.URLParam(r, "appID")
	if appID == "" {
		http.Error(w, "missing micro_app_id", http.StatusBadRequest)
		return
	}
	fmt.Println("AppID:", appID)

	var microApp models.MicroApp
	if err := h.db.Where("micro_app_id = ?", appID).First(&microApp).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			http.Error(w, "micro app not found", http.StatusNotFound)
		} else {
			http.Error(w, fmt.Sprintf("failed to fetch micro app: %v", err), http.StatusInternalServerError)
		}
		return
	}

	var req dto.CreateMicroAppVersionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	version := models.MicroAppVersion{
		MicroAppID:   appID,
		Version:      req.Version,
		Build:        req.Build,
		ReleaseNotes: req.ReleaseNotes,
		IconURL:      req.IconURL,
		DownloadURL:  req.DownloadURL,
		Active:       req.Active,
		CreatedBy:    req.CreatedBy,
		UpdatedBy:    req.UpdatedBy,
	}

	if err := h.db.Create(&version).Error; err != nil {
		http.Error(w, fmt.Sprintf("failed to create version: %v", err), http.StatusInternalServerError)
		return
	}

	writeJSON(w, dto.MicroAppVersionResponse{
		ID:           version.ID,
		MicroAppID:   version.MicroAppID,
		Version:      version.Version,
		Build:        version.Build,
		ReleaseNotes: version.ReleaseNotes,
		IconURL:      version.IconURL,
		DownloadURL:  version.DownloadURL,
		Active:       version.Active,
	})
}
