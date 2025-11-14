package router

import (
	"net/http"

	v1 "go-backend/internal/api/v1/router"
	"go-backend/internal/auth"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"gorm.io/gorm"
)

func NewRouter(db *gorm.DB) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// Apply Auth middleware and mount v1 routes
	r.Route("/api/v1", func(r chi.Router) {
		r.Use(auth.AuthMiddleware)
		r.Mount("/", v1.NewV1Router(db))
	})

	// future: v2 routers can be added here

	return r
}
