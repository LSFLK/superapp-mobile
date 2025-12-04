package router

import (
	"net/http"

	"go-idp/internal/api/v1/handler"
	"go-idp/internal/services"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"gorm.io/gorm"
)

func NewRouter(db *gorm.DB, tokenService *services.TokenService) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	oauthHandler := handler.NewOAuthHandler(db, tokenService)
	keyHandler := handler.NewKeyHandler(tokenService)

	r.Post("/oauth/token", oauthHandler.Token)
	r.Post("/oauth/token/user", oauthHandler.GenerateUserToken)
	r.Get("/.well-known/jwks.json", keyHandler.GetJWKS)

	return r
}
