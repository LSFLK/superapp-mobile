package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"slices"

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
	// Get user info from context (set by auth middleware)
	userInfo, ok := auth.GetUserInfo(r.Context())
	if !ok {
		http.Error(w, "user info not found in context", http.StatusUnauthorized)
		return
	}

	// Get app IDs the user has access to based on their groups
	authorizedAppIDs, err := h.getMicroAppIDsByGroups(userInfo.Groups)
	if err != nil {
		slog.Error("Failed to get authorized app IDs", "error", err, "groups", userInfo.Groups)
		http.Error(w, "failed to fetch micro apps", http.StatusInternalServerError)
		return
	}

	if len(authorizedAppIDs) == 0 {
		if err := writeJSON(w, http.StatusOK, []dto.MicroAppResponse{}); err != nil {
			slog.Error("Failed to write JSON response", "error", err)
			http.Error(w, "failed to write response", http.StatusInternalServerError)
		}
		return
	}

	var apps []models.MicroApp

	// Fetch only active micro apps with their active versions, roles, and configs
	// that the user has access to
	if err := h.db.Where("active = ? AND micro_app_id IN ?", 1, authorizedAppIDs).
		Preload("Versions", "active = ?", 1).
		Preload("Roles", "active = ?", 1).
		Preload("Configs", "active = ?", 1).
		Find(&apps).Error; err != nil {
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

	// Get user info from context (set by auth middleware)
	userInfo, ok := auth.GetUserInfo(r.Context())
	if !ok {
		http.Error(w, "user info not found in context", http.StatusUnauthorized)
		return
	}

	// Get app IDs the user has access to based on their groups
	authorizedAppIDs, err := h.getMicroAppIDsByGroups(userInfo.Groups)
	if err != nil {
		slog.Error("Failed to get authorized app IDs", "error", err, "groups", userInfo.Groups)
		http.Error(w, "failed to fetch micro app", http.StatusInternalServerError)
		return
	}

	// Check if the requested app ID is in the user's authorized list
	isAuthorized := slices.Contains(authorizedAppIDs, id)

	if !isAuthorized {
		slog.Warn("User not authorized to access micro app", "appID", id, "email", userInfo.Email, "groups", userInfo.Groups)
		http.Error(w, "micro app not found", http.StatusNotFound)
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
		slog.Error("Failed to convert micro app to response", "error", err, "appID", id)
		http.Error(w, "failed to fetch", http.StatusInternalServerError)
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

	// Validate request
	if !validateStruct(w, &req) {
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

		// Upsert roles if provided
		if len(req.Roles) > 0 {
			for _, roleReq := range req.Roles {
				role := models.MicroAppRole{}
				roleResult := tx.Where("micro_app_id = ? AND role = ?", req.AppID, roleReq.Role).
					Assign(models.MicroAppRole{
						Active:    1,
						UpdatedBy: &userEmail,
					}).
					Attrs(models.MicroAppRole{
						MicroAppID: req.AppID,
						Role:       roleReq.Role,
						CreatedBy:  userEmail,
					}).FirstOrCreate(&role)

				if roleResult.Error != nil {
					return roleResult.Error
				}
			}
		}

		// Upsert configs if provided
		if len(req.Configs) > 0 {
			for _, configReq := range req.Configs {
				config := models.MicroAppConfig{}
				configResult := tx.Where("micro_app_id = ? AND config_key = ?", req.AppID, configReq.ConfigKey).
					Assign(models.MicroAppConfig{
						ConfigValue: configReq.ConfigValue,
						Active:      1,
						UpdatedBy:   userEmail,
					}).
					Attrs(models.MicroAppConfig{
						MicroAppID:  req.AppID,
						ConfigKey:   configReq.ConfigKey,
						ConfigValue: configReq.ConfigValue,
						CreatedBy:   userEmail,
					}).FirstOrCreate(&config)

				if configResult.Error != nil {
					return configResult.Error
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

	// Use transaction to ensure app, versions, roles, and configs are deactivated together
	err := h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&app).Update("active", 0).Error; err != nil {
			return err
		}
		if err := tx.Model(&models.MicroAppVersion{}).Where("micro_app_id = ?", id).Update("active", 0).Error; err != nil {
			return err
		}
		if err := tx.Model(&models.MicroAppRole{}).Where("micro_app_id = ?", id).Update("active", 0).Error; err != nil {
			return err
		}
		if err := tx.Model(&models.MicroAppConfig{}).Where("micro_app_id = ?", id).Update("active", 0).Error; err != nil {
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

// Fetches micro app IDs accessible by the given user groups
func (h *MicroAppHandler) getMicroAppIDsByGroups(groups []string) ([]string, error) {
	if len(groups) == 0 {
		slog.Warn("No groups found for the user")
		return []string{}, nil
	}

	var appIDs []string
	if err := h.db.Model(&models.MicroAppRole{}).
		Select("DISTINCT micro_app_id").
		Where("active = ? AND role IN ?", 1, groups).
		Pluck("micro_app_id", &appIDs).Error; err != nil {
		return nil, err
	}

	if len(appIDs) == 0 {
		slog.Warn("No micro apps found for the given groups", "groups", groups)
		return []string{}, nil
	}

	return appIDs, nil
}

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

// Fetches active roles for a micro app and converts to response format
func (h *MicroAppHandler) fetchRolesForApp(microAppID string) ([]dto.MicroAppRoleResponse, error) {
	var roles []models.MicroAppRole
	if err := h.db.Where("micro_app_id = ? AND active = ?", microAppID, 1).Find(&roles).Error; err != nil {
		return nil, err
	}

	var roleResponses []dto.MicroAppRoleResponse
	for _, r := range roles {
		roleResponses = append(roleResponses, dto.MicroAppRoleResponse{
			ID:         r.ID,
			MicroAppID: r.MicroAppID,
			Role:       r.Role,
			Active:     r.Active,
		})
	}

	return roleResponses, nil
}

// Fetches active configs for a micro app and converts to response format
func (h *MicroAppHandler) fetchConfigsForApp(microAppID string) ([]dto.MicroAppConfigResponse, error) {
	var configs []models.MicroAppConfig
	if err := h.db.Where("micro_app_id = ? AND active = ?", microAppID, 1).Find(&configs).Error; err != nil {
		return nil, err
	}

	var configResponses []dto.MicroAppConfigResponse
	for _, c := range configs {
		// Marshal JSONMap to json.RawMessage
		configValueBytes, err := json.Marshal(c.ConfigValue)
		if err != nil {
			return nil, err
		}
		configResponses = append(configResponses, dto.MicroAppConfigResponse{
			ConfigKey:   c.ConfigKey,
			ConfigValue: json.RawMessage(configValueBytes),
		})
	}

	return configResponses, nil
}

// Converts a MicroApp model to response DTO with versions, roles, and configs
func (h *MicroAppHandler) convertToResponse(app models.MicroApp) (dto.MicroAppResponse, error) {
	versions, err := h.fetchVersionsForApp(app.MicroAppID)
	if err != nil {
		return dto.MicroAppResponse{}, err
	}

	roles, err := h.fetchRolesForApp(app.MicroAppID)
	if err != nil {
		return dto.MicroAppResponse{}, err
	}

	configs, err := h.fetchConfigsForApp(app.MicroAppID)
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
		Roles:       roles,
		Configs:     configs,
	}, nil
}

// Converts a MicroApp model with preloaded versions, roles, and configs to response DTO
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

	var roleResponses []dto.MicroAppRoleResponse
	for _, r := range app.Roles {
		roleResponses = append(roleResponses, dto.MicroAppRoleResponse{
			ID:         r.ID,
			MicroAppID: r.MicroAppID,
			Role:       r.Role,
			Active:     r.Active,
		})
	}

	var configResponses []dto.MicroAppConfigResponse
	for _, c := range app.Configs {
		// Marshal JSONMap to json.RawMessage
		configValueBytes, _ := json.Marshal(c.ConfigValue)
		configResponses = append(configResponses, dto.MicroAppConfigResponse{
			ConfigKey:   c.ConfigKey,
			ConfigValue: json.RawMessage(configValueBytes),
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
		Roles:       roleResponses,
		Configs:     configResponses,
	}
}
