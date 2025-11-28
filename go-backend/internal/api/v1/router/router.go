package router

import (
	"net/http"

	"go-backend/internal/api/v1/handler"
	"go-backend/internal/services"

	"github.com/go-chi/chi/v5"
	"gorm.io/gorm"
)

// NewV1Router returns the main http.Handler configured with chi routes.
func NewV1Router(db *gorm.DB, fcmService *services.FCMService) http.Handler {
	r := chi.NewRouter()

	r.Mount("/micro-apps", MicroAppRoutes(db))
	r.Mount("/device-tokens", DeviceTokenRoutes(db, fcmService))

	return r
}

// ServiceRoutes sets up a sub-router for all service-to-service endpoints.
func NewV1ServiceRoutes(db *gorm.DB, fcmService *services.FCMService) http.Handler {
	r := chi.NewRouter()

	r.Mount("/notifications", NotificationRoutes(db, fcmService))

	return r
}

// MicroAppRoutes sets up a sub-router for all endpoints prefixed with /micro-apps.
func MicroAppRoutes(db *gorm.DB) http.Handler {
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

// DeviceTokenRoutes sets up a sub-router for device token endpoints
func DeviceTokenRoutes(db *gorm.DB, fcmService *services.FCMService) http.Handler {
	r := chi.NewRouter()

	notificationHandler := handler.NewNotificationHandler(db, fcmService)

	// POST /device-tokens
	r.Post("/", notificationHandler.RegisterDeviceToken)

	return r
}

// NotificationRoutes sets up a sub-router for notification endpoints
func NotificationRoutes(db *gorm.DB, fcmService *services.FCMService) http.Handler {
	r := chi.NewRouter()

	notificationHandler := handler.NewNotificationHandler(db, fcmService)

	// POST /notifications/send
	r.Post("/send", notificationHandler.SendNotification)

	return r
}
