package router

import (
	"net/http"

	"go-backend/internal/api/v1/handler"
	"go-backend/internal/config"
	"go-backend/internal/services"

	"github.com/go-chi/chi/v5"
	"gorm.io/gorm"
)

// NewUserRouter returns the http.Handler for user-authenticated routes (Asgardeo).
func NewUserRouter(db *gorm.DB, fcmService services.NotificationService, cfg *config.Config) http.Handler {
	r := chi.NewRouter()

	r.Mount("/micro-apps", MicroAppRoutes(db))
	r.Mount("/device-tokens", DeviceTokenRoutes(db, fcmService))
	r.Mount("/token", TokenRoutes(cfg))

	return r
}

// NewServiceRouter returns the http.Handler for service-authenticated routes (Internal IDP).
func NewServiceRouter(db *gorm.DB, fcmService services.NotificationService) http.Handler {
	r := chi.NewRouter()

	r.Mount("/notifications", NotificationRoutes(db, fcmService))

	return r
}

// NewNoAuthRouter returns the http.Handler for public/gateway routes (OAuth, JWKS).
// These routes handle authentication protocols and do not require backend-level auth middleware.
func NewNoAuthRouter(cfg *config.Config, serviceTokenValidator services.TokenValidator) http.Handler {
	r := chi.NewRouter()

	tokenHandler := handler.NewTokenHandler(cfg, serviceTokenValidator)

	// OAuth  token endpoint - proxies to internal IDP for service token generation
	r.Post("/oauth/token", tokenHandler.ProxyOAuthToken)

	// JWKS endpoint - serves cached JWKS for microapp token validation
	r.Get("/.well-known/jwks.json", tokenHandler.GetJWKS)

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
func DeviceTokenRoutes(db *gorm.DB, fcmService services.NotificationService) http.Handler {
	r := chi.NewRouter()

	notificationHandler := handler.NewNotificationHandler(db, fcmService)

	// POST /device-tokens
	r.Post("/", notificationHandler.RegisterDeviceToken)

	return r
}

// NotificationRoutes sets up a sub-router for notification endpoints
func NotificationRoutes(db *gorm.DB, fcmService services.NotificationService) http.Handler {
	r := chi.NewRouter()

	notificationHandler := handler.NewNotificationHandler(db, fcmService)

	// POST /notifications/send
	r.Post("/send", notificationHandler.SendNotification)

	return r
}

// TokenRoutes sets up a sub-router for token endpoints
func TokenRoutes(cfg *config.Config) http.Handler {
	r := chi.NewRouter()

	tokenHandler := handler.NewTokenHandler(cfg, nil) // nil as JWKS not needed for token exchange

	// POST /token/exchange - Exchange user token for microapp token (requires user auth)
	r.Post("/exchange", tokenHandler.ExchangeToken)

	return r
}
