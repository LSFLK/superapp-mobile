package auth

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"

	"go-backend/internal/config"
)

const (
	authHeader             = "Authorization"
	headerContentPartCount = 2 // "Bearer <token>"
	bearerTypeIndex        = 0 // "Bearer"
	tokenIndex             = 1 // "<token>"
)

// AuthMiddleware is the middleware that validates JWT tokens.
func AuthMiddleware(cfg *config.Config) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

			// 1. Get the token from Authorization header (Authorization: Bearer <token>)
			authHeader := r.Header.Get(authHeader)
			if authHeader == "" {
				slog.Warn("Missing Authorization header", "path", r.URL.Path, "method", r.Method)
				writeError(w, http.StatusUnauthorized, "Missing Authorization header")
				return
			}

			// 2. Extract Bearer token
			parts := strings.Split(authHeader, " ")
			if len(parts) != headerContentPartCount || strings.ToLower(parts[bearerTypeIndex]) != "bearer" {
				slog.Warn("Invalid Authorization header format", "path", r.URL.Path, "method", r.Method)
				writeError(w, http.StatusUnauthorized, "Invalid Authorization header format. Expected: Bearer <token>")
				return
			}

			tokenString := parts[tokenIndex]

			// 3. Validate the token
			userInfo, err := ValidateJWT(tokenString, cfg.JWKSURL, cfg.JWTIssuer, cfg.JWTAudience)
			if err != nil {
				slog.Error("Token validation failed", "error", err, "path", r.URL.Path, "method", r.Method)
				writeError(w, http.StatusUnauthorized, "Error while validating token")
				return
			}

			// 4. Set user info in context
			r = SetUserInfo(r, userInfo)

			// 5. Call the next handler in the chain
			next.ServeHTTP(w, r)
		})
	}
}

// Writes an error message as a JSON response with the given status code.
func writeError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"message": message})
}
