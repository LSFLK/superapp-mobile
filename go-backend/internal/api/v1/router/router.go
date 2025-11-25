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

	r.Mount("/micro-apps", microAppRoutes(db))
	r.Mount("/device-tokens", deviceTokenRoutes(db, fcmService))
	r.Mount("/notifications", notificationRoutes(db, fcmService))

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

// deviceTokenRoutes sets up a sub-router for device token endpoints
func deviceTokenRoutes(db *gorm.DB, fcmService *services.FCMService) http.Handler {
	r := chi.NewRouter()

	notificationHandler := handler.NewNotificationHandler(db, fcmService)

	// POST /device-tokens
	r.Post("/", notificationHandler.RegisterDeviceToken)

	return r
}

// notificationRoutes sets up a sub-router for notification endpoints
func notificationRoutes(db *gorm.DB, fcmService *services.FCMService) http.Handler {
	r := chi.NewRouter()

	notificationHandler := handler.NewNotificationHandler(db, fcmService)

	// POST /notifications/send
	r.Post("/send", notificationHandler.SendNotification)

	// POST /notifications/send-to-groups
	r.Post("/send-to-groups", notificationHandler.SendToGroups)

	return r
}
