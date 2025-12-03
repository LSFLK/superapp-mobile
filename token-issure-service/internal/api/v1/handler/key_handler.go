package handler

import (
	"net/http"

	"go-idp/internal/services"
)

type KeyHandler struct {
	tokenService *services.TokenService
}

func NewKeyHandler(tokenService *services.TokenService) *KeyHandler {
	return &KeyHandler{
		tokenService: tokenService,
	}
}

// GetJWKS serves the public key in JWKS format
func (h *KeyHandler) GetJWKS(w http.ResponseWriter, r *http.Request) {
	jwksBytes, err := h.tokenService.GetJWKS()
	if err != nil {
		http.Error(w, "Public key not available", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(jwksBytes)
}
