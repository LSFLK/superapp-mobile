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

type MicroAppHandler struct {
	db *gorm.DB
}

func NewMicroAppHandler(db *gorm.DB) *MicroAppHandler {
	return &MicroAppHandler{db: db}
}

// MicroAppHandler to handle fetching all micro apps
func (h *MicroAppHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	var apps []models.MicroApp
	if err := h.db.Find(&apps).Error; err != nil {
		http.Error(w, fmt.Sprintf("failed to fetch micro apps: %v", err), http.StatusInternalServerError)
		return
	}

	var response []dto.MicroAppResponse
	for _, a := range apps {
		appResponse, err := h.convertToResponse(a)
		if err != nil {
			http.Error(w, fmt.Sprintf("failed to fetch versions: %v", err), http.StatusInternalServerError)
			return
		}
		response = append(response, appResponse)
	}
	writeJSON(w, response)
}

// MicroAppHandler to handle fetching a micro app by ID
func (h *MicroAppHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "appID")
	if id == "" {
		http.Error(w, "missing micro_app_id", http.StatusBadRequest)
		return
	}

	var app models.MicroApp
	if err := h.db.Where("micro_app_id = ?", id).First(&app).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			http.Error(w, "micro app not found", http.StatusNotFound)
		} else {
			http.Error(w, fmt.Sprintf("failed to fetch micro app: %v", err), http.StatusInternalServerError)
		}
		return
	}

	appResponse, err := h.convertToResponse(app)
	if err != nil {
		http.Error(w, fmt.Sprintf("failed to fetch versions: %v", err), http.StatusInternalServerError)
		return
	}

	writeJSON(w, appResponse)
}

// MicroAppHandler to handle upserting a new micro app
func (h *MicroAppHandler) Upsert(w http.ResponseWriter, r *http.Request) {
	var req dto.CreateMicroAppRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	app := models.MicroApp{}
	result := h.db.Where("micro_app_id = ?", req.AppID).
		Assign(models.MicroApp{
			Name:        req.Name,
			Description: req.Description,
			IconURL:     req.IconURL,
			Active:      req.Active,
			Mandatory:   req.Mandatory,
			UpdatedBy:   req.UpdatedBy,
		}).
		Attrs(models.MicroApp{
			MicroAppID: req.AppID,
			CreatedBy:  req.CreatedBy,
		}).FirstOrCreate(&app)

	if result.Error != nil {
		http.Error(w, fmt.Sprintf("failed to upsert micro app: %v", result.Error), http.StatusInternalServerError)
		return
	}

	// Upsert versions if provided
	if len(req.Versions) > 0 {
		for _, versionReq := range req.Versions {
			version := models.MicroAppVersion{}
			versionResult := h.db.Where("micro_app_id = ? AND version = ? AND build = ?", req.AppID, versionReq.Version, versionReq.Build).
				Assign(models.MicroAppVersion{
					ReleaseNotes: versionReq.ReleaseNotes,
					IconURL:      versionReq.IconURL,
					DownloadURL:  versionReq.DownloadURL,
					Active:       versionReq.Active,
					UpdatedBy:    versionReq.UpdatedBy,
				}).
				Attrs(models.MicroAppVersion{
					MicroAppID: req.AppID,
					Version:    versionReq.Version,
					Build:      versionReq.Build,
					CreatedBy:  versionReq.CreatedBy,
				}).FirstOrCreate(&version)

			if versionResult.Error != nil {
				http.Error(w, fmt.Sprintf("failed to upsert version: %v", versionResult.Error), http.StatusInternalServerError)
				return
			}
		}
	}

	appResponse, err := h.convertToResponse(app)
	if err != nil {
		http.Error(w, fmt.Sprintf("failed to fetch versions: %v", err), http.StatusInternalServerError)
		return
	}

	writeJSON(w, appResponse)
}

// MicroAppHandler to handle deactivating a micro app
func (h *MicroAppHandler) Deactivate(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "appID")
	if id == "" {
		http.Error(w, "missing micro_app_id", http.StatusBadRequest)
		return
	}

	var app models.MicroApp
	if err := h.db.Where("micro_app_id = ?", id).First(&app).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			http.Error(w, "micro app not found", http.StatusNotFound)
		} else {
			http.Error(w, fmt.Sprintf("failed to fetch micro app: %v", err), http.StatusInternalServerError)
		}
		return
	}

	if err := h.db.Model(&app).Update("active", 0).Error; err != nil {
		http.Error(w, fmt.Sprintf("failed to deactivate micro app: %v", err), http.StatusInternalServerError)
		return
	}

	// Deactivate all versions associated with this micro app
	if err := h.db.Model(&models.MicroAppVersion{}).Where("micro_app_id = ?", id).Update("active", 0).Error; err != nil {
		http.Error(w, fmt.Sprintf("failed to deactivate micro app versions: %v", err), http.StatusInternalServerError)
		return
	}

	app.Active = 0
	appResponse, err := h.convertToResponse(app)
	if err != nil {
		http.Error(w, fmt.Sprintf("failed to fetch versions: %v", err), http.StatusInternalServerError)
		return
	}

	writeJSON(w, appResponse)
}

// Healper Functions

// Fetches active versions for a micro app and converts to response format
func (h *MicroAppHandler) fetchVersionsForApp(microAppID string) ([]dto.MicroAppVersionResponse, error) {
	var versions []models.MicroAppVersion
	if err := h.db.Where("micro_app_id = ? AND active = ?", microAppID, 1).Find(&versions).Error; err != nil {
		return nil, err
	}

	var versionResponses []dto.MicroAppVersionResponse
	for _, v := range versions {
		versionResponses = append(versionResponses, dto.MicroAppVersionResponse{
			ID:           v.ID,
			MicroAppID:   v.MicroAppID,
			Version:      v.Version,
			Build:        v.Build,
			ReleaseNotes: v.ReleaseNotes,
			IconURL:      v.IconURL,
			DownloadURL:  v.DownloadURL,
			Active:       v.Active,
		})
	}

	return versionResponses, nil
}

// Converts a MicroApp model to response DTO with versions
func (h *MicroAppHandler) convertToResponse(app models.MicroApp) (dto.MicroAppResponse, error) {
	versions, err := h.fetchVersionsForApp(app.MicroAppID)
	if err != nil {
		return dto.MicroAppResponse{}, err
	}

	return dto.MicroAppResponse{
		AppID:       app.MicroAppID,
		Name:        app.Name,
		Description: app.Description,
		IconURL:     app.IconURL,
		Active:      app.Active,
		Mandatory:   app.Mandatory,
		Versions:    versions,
	}, nil
}
