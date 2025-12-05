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

// ReloadKeys triggers a reload of the keys from the directory
func (h *KeyHandler) ReloadKeys(w http.ResponseWriter, r *http.Request) {
	if err := h.tokenService.ReloadKeys(); err != nil {
		http.Error(w, "Failed to reload keys: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Keys reloaded successfully"}`))
}

// SetActiveKey updates the active signing key
func (h *KeyHandler) SetActiveKey(w http.ResponseWriter, r *http.Request) {
	keyID := r.URL.Query().Get("key_id")
	if keyID == "" {
		http.Error(w, "key_id parameter is required", http.StatusBadRequest)
		return
	}

	if err := h.tokenService.SetActiveKey(keyID); err != nil {
		http.Error(w, "Failed to set active key: "+err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Active key updated successfully"}`))
}
