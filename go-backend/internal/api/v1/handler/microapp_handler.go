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

type MicroAppHandler struct {
	db *gorm.DB
}

func NewMicroAppHandler(db *gorm.DB) *MicroAppHandler {
	return &MicroAppHandler{db: db}
}

// MicroAppHandler to handle fetching all micro apps
func (h *MicroAppHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	var apps []models.MicroApp

	// Fetch only active micro apps with their active versions
	if err := h.db.Where("active = ?", 1).Preload("Versions", "active = ?", 1).Find(&apps).Error; err != nil {
		slog.Error("Failed to fetch micro apps from database", "error", err)
		http.Error(w, "failed to fetch micro apps", http.StatusInternalServerError)
		return
	}

	var response []dto.MicroAppResponse
	for _, app := range apps {
		appResponse := h.convertToResponseFromPreloaded(app)
		response = append(response, appResponse)
	}

	if err := writeJSON(w, http.StatusOK, response); err != nil {
		slog.Error("Failed to write JSON response", "error", err)
		http.Error(w, "failed to write response", http.StatusInternalServerError)
	}
}

// MicroAppHandler to handle fetching a micro app by ID
func (h *MicroAppHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "appID")
	if id == "" {
		http.Error(w, "missing micro_app_id", http.StatusBadRequest)
		return
	}

	var app models.MicroApp
	if err := h.db.Where("micro_app_id = ? AND active = ?", id, 1).First(&app).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			http.Error(w, "micro app not found", http.StatusNotFound)
		} else {
			slog.Error("Failed to fetch micro app", "error", err, "appID", id)
			http.Error(w, "failed to fetch micro app", http.StatusInternalServerError)
		}
		return
	}

	appResponse, err := h.convertToResponse(app)
	if err != nil {
		slog.Error("Failed to fetch versions for micro app", "error", err, "appID", id)
		http.Error(w, "failed to fetch versions", http.StatusInternalServerError)
		return
	}

	if err := writeJSON(w, http.StatusOK, appResponse); err != nil {
		slog.Error("Failed to write JSON response", "error", err)
		http.Error(w, "failed to write response", http.StatusInternalServerError)
	}
}

// MicroAppHandler to handle upserting a new micro app
func (h *MicroAppHandler) Upsert(w http.ResponseWriter, r *http.Request) {
	// Get user info from context (set by auth middleware)
	userInfo, ok := auth.GetUserInfo(r.Context())
	if !ok {
		http.Error(w, "user info not found in context", http.StatusUnauthorized)
		return
	}
	userEmail := userInfo.Email

	if !validateContentType(w, r) {
		return
	}

	limitRequestBody(w, r, 0) // 1MB default limit
	var req dto.CreateMicroAppRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if !validateRequiredStrings(w, map[string]string{
		"appId": req.AppID,
		"name":  req.Name,
	}) {
		return
	}

	var app models.MicroApp

	// Use transaction to ensure app and all versions are upserted atomically
	err := h.db.Transaction(func(tx *gorm.DB) error {
		// Upsert micro app
		result := tx.Where("micro_app_id = ?", req.AppID).
			Assign(models.MicroApp{
				Name:        req.Name,
				Description: req.Description,
				IconURL:     req.IconURL,
				Mandatory:   req.Mandatory,
				Active:      1,
				UpdatedBy:   &userEmail,
			}).
			Attrs(models.MicroApp{
				MicroAppID: req.AppID,
				CreatedBy:  userEmail,
			}).FirstOrCreate(&app)

		if result.Error != nil {
			return result.Error
		}

		// Upsert versions if provided
		if len(req.Versions) > 0 {
			for _, versionReq := range req.Versions {
				version := models.MicroAppVersion{}
				versionResult := tx.Where("micro_app_id = ? AND version = ? AND build = ?", req.AppID, versionReq.Version, versionReq.Build).
					Assign(models.MicroAppVersion{
						ReleaseNotes: versionReq.ReleaseNotes,
						IconURL:      versionReq.IconURL,
						DownloadURL:  versionReq.DownloadURL,
						Active:       1,
						UpdatedBy:    &userEmail,
					}).
					Attrs(models.MicroAppVersion{
						MicroAppID: req.AppID,
						Version:    versionReq.Version,
						Build:      versionReq.Build,
						CreatedBy:  userEmail,
					}).FirstOrCreate(&version)

				if versionResult.Error != nil {
					return versionResult.Error
				}
			}
		}

		return nil
	})

	if err != nil {
		slog.Error("Failed to upsert micro app", "error", err, "appID", req.AppID)
		http.Error(w, "failed to upsert micro app", http.StatusInternalServerError)
		return
	}

	appResponse, err := h.convertToResponse(app)
	if err != nil {
		slog.Error("Failed to fetch versions for micro app", "error", err, "appID", req.AppID)
		http.Error(w, "failed to fetch versions", http.StatusInternalServerError)
		return
	}

	if err := writeJSON(w, http.StatusCreated, appResponse); err != nil {
		slog.Error("Failed to write JSON response", "error", err)
		http.Error(w, "failed to write response", http.StatusInternalServerError)
	}
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
			slog.Error("Failed to fetch micro app", "error", err, "appID", id)
			http.Error(w, "failed to fetch micro app", http.StatusInternalServerError)
		}
		return
	}

	// Use transaction to ensure both app and versions are deactivated together
	err := h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&app).Update("active", 0).Error; err != nil {
			return err
		}
		if err := tx.Model(&models.MicroAppVersion{}).Where("micro_app_id = ?", id).Update("active", 0).Error; err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		slog.Error("Failed to deactivate micro app", "error", err, "appID", id)
		http.Error(w, "failed to deactivate micro app", http.StatusInternalServerError)
		return
	}

	if err := writeJSON(w, http.StatusOK, map[string]string{"message": "Micro app deactivated successfully"}); err != nil {
		slog.Error("Failed to write JSON response", "error", err)
		http.Error(w, "failed to write response", http.StatusInternalServerError)
	}
}

// Helper Functions

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

// Converts a MicroApp model with preloaded versions to response DTO
func (h *MicroAppHandler) convertToResponseFromPreloaded(app models.MicroApp) dto.MicroAppResponse {
	var versionResponses []dto.MicroAppVersionResponse
	for _, v := range app.Versions {
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

	return dto.MicroAppResponse{
		AppID:       app.MicroAppID,
		Name:        app.Name,
		Description: app.Description,
		IconURL:     app.IconURL,
		Active:      app.Active,
		Mandatory:   app.Mandatory,
		Versions:    versionResponses,
	}
}
