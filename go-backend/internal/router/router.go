package router

import (
	"log/slog"
	"net/http"

	"go-backend/internal/api/v1/handler"
	v1 "go-backend/internal/api/v1/router"
	"go-backend/internal/auth"
	"go-backend/internal/config"
	"go-backend/internal/services"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"gorm.io/gorm"
)

func NewRouter(db *gorm.DB, cfg *config.Config, fcmService *services.FCMService) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	tokenService, err := services.NewTokenService(cfg.JWTPrivateKeyPath, cfg.JWTPublicKeyPath, cfg.TokenExpiry)
	if err != nil {
		slog.Error("Failed to initialize TokenService: " + err.Error())
	}

	// Initialize OAuth Handler and define public token endpoint
	// Note: This endpoint is public (unauthenticated) to allow clients to exchange credentials for tokens.
	// It MUST be served over HTTPS in production to protect client secrets.
	if tokenService != nil {
		oauthHandler := handler.NewOAuthHandler(db, tokenService)
		r.Post("/oauth/token", oauthHandler.Token)
	}

	// User Authenticated Routes
	r.Route("/api/v1", func(r chi.Router) {
		r.Use(auth.AuthMiddleware(cfg))
		r.Mount("/", v1.NewV1Router(db, fcmService))
	})

	// Service Authenticated Routes (OAuth2)
	r.Group(func(r chi.Router) {
		if tokenService != nil {
			r.Use(auth.ServiceOAuthMiddleware(tokenService))
		}
		r.Mount("/api/v1/services", v1.NewV1ServiceRoutes(db, fcmService))
	})

	// future: v2 routers can be added here

	return r
}
