package router

import (
	"log/slog"
	"net/http"

	"go-backend/internal/api/v1/handler"
	"go-backend/internal/config"
	"go-backend/internal/fileservice/core"

	"github.com/go-chi/chi/v5"
	"gorm.io/gorm"
)

// NewV1Router returns the main http.Handler configured with chi routes.
func NewV1Router(db *gorm.DB, cfg *config.Config) http.Handler {
	r := chi.NewRouter()

	r.Mount("/micro-apps", microAppRoutes(db))

	fileService, err := core.NewFileService(cfg.FileServiceType)
	if err != nil {
		slog.Error("Failed to create file service", "error", err)
		panic(err)
	}
	r.Mount("/files", fileRoutes(fileService))

	return r
}

// NewV1PublicRouter sets up public routes that do not require authentication.
func NewV1PublicRouter(db *gorm.DB, cfg *config.Config) http.Handler {
	r := chi.NewRouter()

	fileService, err := core.NewFileService(cfg.FileServiceType)
	if err != nil {
		slog.Error("Failed to create file service for public routes", "error", err)
		panic(err)
	}

	// GET /micro-app-files/download/{fileName}
	r.Get("/micro-app-files/download/{fileName}", handler.NewFileHandler(fileService).DownloadMicroAppFile)
	return r
}

// microAppRoutes sets up a sub-router for all endpoints prefixed with /micro-apps.
func microAppRoutes(db *gorm.DB) http.Handler {
	r := chi.NewRouter()

	// Initialize Microapp Handlers
	microappHandler := handler.NewMicroAppHandler(db)
	microappVersionHandler := handler.NewMicroAppVersionHandler(db)

	// GET /micro-apps
	r.Get("/", microappHandler.GetAll)

	// GET /micro-apps/{appID}
	r.Get("/{appID}", microappHandler.GetByID)

	// POST /micro-apps
	r.Post("/", microappHandler.Upsert)

	// PUT /micro-apps/deactivate/{appID}
	r.Put("/deactivate/{appID}", microappHandler.Deactivate)

	// POST /micro-apps/{appID}/versions
	r.Post("/{appID}/versions", microappVersionHandler.UpsertVersion)

	return r
}

// fileRoutes sets up a sub-router for file operations.
func fileRoutes(fileService core.FileService) http.Handler {
	r := chi.NewRouter()

	fileHandler := handler.NewFileHandler(fileService)

	// POST /files?fileName=xxx
	r.Post("/", fileHandler.UploadFile)

	// DELETE /files?fileName=xxx
	r.Delete("/", fileHandler.DeleteFile)

	return r
}
