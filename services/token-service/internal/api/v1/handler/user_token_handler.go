package handler

import (
	"log/slog"
	"net/http"
)

// UserTokenRequest represents a request for a user-context token
type UserTokenRequest struct {
	GrantType  string `json:"grant_type"`
	UserEmail  string `json:"user_email"`
	MicroappID string `json:"microapp_id"`
	Scope      string `json:"scope,omitempty"`
}

// GenerateUserToken generates a microapp-scoped token with user context
// This is called by go-backend when exchanging user tokens
func (h *OAuthHandler) GenerateUserToken(w http.ResponseWriter, r *http.Request) {
	limitRequestBody(w, r, 0)

	if err := r.ParseForm(); err != nil {
		writeError(w, http.StatusBadRequest, errInvalidRequest, "invalid form data")
		return
	}

	grantType := r.FormValue("grant_type")
	userEmail := r.FormValue("user_email")
	microappID := r.FormValue("microapp_id")
	scope := r.FormValue("scope")

	if grantType != grantTypeUserContext {
		writeError(w, http.StatusBadRequest, errUnsupportedGrant, "")
		return
	}

	if userEmail == "" || microappID == "" {
		writeError(w, http.StatusBadRequest, errInvalidRequest, "user_email and microapp_id are required")
		return
	}

	token, err := h.tokenService.GenerateUserToken(userEmail, microappID, scope)
	if err != nil {
		slog.Error("Failed to generate user token", "error", err, "user", userEmail, "microapp", microappID)
		writeError(w, http.StatusInternalServerError, errServerError, "")
		return
	}

	slog.Info("User token generated", "user", userEmail, "microapp", microappID)

	resp := TokenResponse{
		AccessToken: token,
		TokenType:   tokenTypeBearer,
		ExpiresIn:   h.tokenService.GetExpiry(),
	}
	writeJSON(w, http.StatusOK, resp)
}
