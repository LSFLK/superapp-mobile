package handler

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"

	"go-idp/internal/models"
	"go-idp/internal/services"

	"gorm.io/gorm"
)

const (
	grantTypeClientCredentials = "client_credentials"
	grantTypeUserContext       = "user_context"
	tokenTypeBearer            = "Bearer"

	// OAuth2 error codes (RFC 6749)
	errInvalidRequest   = "invalid_request"
	errInvalidClient    = "invalid_client"
	errUnsupportedGrant = "unsupported_grant_type"
	errServerError      = "server_error"
)

type OAuthHandler struct {
	db           *gorm.DB
	tokenService *services.TokenService
}

func NewOAuthHandler(db *gorm.DB, tokenService *services.TokenService) *OAuthHandler {
	return &OAuthHandler{
		db:           db,
		tokenService: tokenService,
	}
}

type TokenRequest struct {
	GrantType    string `json:"grant_type"`
	ClientID     string `json:"client_id"`
	ClientSecret string `json:"client_secret"`
}

type TokenResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	ExpiresIn   int    `json:"expires_in"`
}

// Token handles the OAuth2 token endpoint
func (h *OAuthHandler) Token(w http.ResponseWriter, r *http.Request) {
	limitRequestBody(w, r, 0)

	// Parse request
	// Support both JSON body and Form data (standard OAuth2 uses form data, but JSON is common in APIs)
	var clientID, clientSecret, grantType string

	contentType := r.Header.Get("Content-Type")
	if strings.Contains(contentType, "application/json") {
		var req TokenRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, errInvalidRequest, "invalid request body")
			return
		}
		clientID = req.ClientID
		clientSecret = req.ClientSecret
		grantType = req.GrantType
	} else {
		// Fallback to Form/Basic Auth
		if err := r.ParseForm(); err != nil {
			writeError(w, http.StatusBadRequest, errInvalidRequest, "invalid form data")
			return
		}
		grantType = r.FormValue("grant_type")

		// Check Basic Auth first
		user, pass, ok := r.BasicAuth()
		if ok {
			clientID = user
			clientSecret = pass
		} else {
			clientID = r.FormValue("client_id")
			clientSecret = r.FormValue("client_secret")
		}
	}

	if grantType != grantTypeClientCredentials {
		writeError(w, http.StatusBadRequest, errUnsupportedGrant, "")
		return
	}

	if clientID == "" || clientSecret == "" {
		writeError(w, http.StatusBadRequest, errInvalidClient, "client_id and client_secret are required")
		return
	}

	// Validate Client
	var OAuth2client models.OAuth2Client
	if err := h.db.Where("client_id = ? AND is_active = ?", clientID, true).First(&OAuth2client).Error; err != nil {
		slog.Warn("Client not found or inactive", "client_id", clientID)
		writeError(w, http.StatusUnauthorized, errInvalidClient, "")
		return
	}

	// Verify Secret (Hash comparison)
	// In production, use bcrypt or argon2.
	// For simplicity here use SHA256.
	hashedSecret := hashSecret(clientSecret)
	if hashedSecret != OAuth2client.ClientSecret {
		slog.Warn("Invalid client secret", "client_id", clientID)
		writeError(w, http.StatusUnauthorized, errInvalidClient, "")
		return
	}

	// Issue Token
	token, err := h.tokenService.IssueToken(OAuth2client.ClientID, OAuth2client.Scopes)
	if err != nil {
		slog.Error("Failed to issue token", "error", err)
		writeError(w, http.StatusInternalServerError, errServerError, "")
		return
	}

	// Respond
	resp := TokenResponse{
		AccessToken: token,
		TokenType:   tokenTypeBearer,
		ExpiresIn:   h.tokenService.GetExpiry(),
	}
	writeJSON(w, http.StatusOK, resp)
}

func hashSecret(secret string) string {
	hash := sha256.Sum256([]byte(secret))
	return hex.EncodeToString(hash[:])
}
