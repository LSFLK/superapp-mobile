package router

import (
	"log/slog"
	"net/http"

	v1 "go-backend/internal/api/v1/router"
	"go-backend/internal/auth"
	"go-backend/internal/config"
	"go-backend/internal/services"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"gorm.io/gorm"
)

const (
	apiV1Prefix = "/api/v1"
)

func NewRouter(db *gorm.DB, cfg *config.Config) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// set up validators and services

	// Initialize User Token Validator (External IDP)
	externalIDPValidator, err := services.NewTokenValidatorWithJWKSURL(
		cfg.ExternalIdPJWKSURL,
		cfg.ExternalIdPIssuer,
		cfg.ExternalIdPAudience,
	)
	if err != nil {
		slog.Error("Failed to initialize External IDP Validator", "error", err)
	} else {
		slog.Info("External IDP Validator initialized successfully", "issuer", cfg.ExternalIdPIssuer)
	}

	// Initialize Service Token Validator (Internal IDP)
	internalIDPValidator, err := services.NewTokenValidator(cfg.InternalIdPBaseURL)
	if err != nil {
		slog.Error("Failed to initialize Internal IDP Validator", "error", err)
	} else {
		slog.Info("Internal IDP Validator initialized successfully", "idp_url", cfg.InternalIdPBaseURL)
	}

	// Initialize FCM service
	var fcmService services.NotificationService
	if cfg.FirebaseCredentialsPath != "" {
		fcmService, err = services.NewFCMService(cfg.FirebaseCredentialsPath)
		if err != nil {
			slog.Error("Failed to initialize FCM service", "error", err)
		} else {
			slog.Info("FCM service initialized successfully")
		}
	} else {
		slog.Warn("Firebase credentials path not configured, notification features will be unavailable")
	}

	// set up routes
	// v1

	// Public Routes (no authentication required)
	// Auth Router (Gateway/Public - OAuth, JWKS)
	r.Mount("/", v1.NewAuthRouter(cfg, internalIDPValidator))

	// User Authenticated Routes (validates against External IDP)
	r.Route(apiV1Prefix, func(r chi.Router) {
		if externalIDPValidator != nil {
			r.Use(auth.AuthMiddleware(externalIDPValidator))
		}
		r.Mount("/", v1.NewUserRouter(db, fcmService, cfg))
	})

	// Service Routes (validates against Internal IDP)
	r.Route(apiV1Prefix+"/services", func(r chi.Router) {
		if internalIDPValidator != nil {
			r.Use(auth.ServiceOAuthMiddleware(internalIDPValidator))
		}
		r.Mount("/", v1.NewServiceRouter(db, fcmService))
	})

	return r
}
