package auth

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"

	"go-backend/internal/services"
)

const (
	authHeader  = "Authorization"
	bearerToken = "bearer"
)

// AuthMiddleware is the middleware that validates JWT tokens for users.
func AuthMiddleware(tokenValidator services.TokenValidator) func(http.Handler) http.Handler {
	return validateTokenMiddleware(tokenValidator, func(r *http.Request, claims *services.TokenClaims) *http.Request {
		userInfo := &CustomJwtPayload{
			Email:  claims.Email,
			Groups: claims.Groups,
		}
		return SetUserInfo(r, userInfo)
	})
}

// ServiceOAuthMiddleware validates the Bearer token for services.
func ServiceOAuthMiddleware(tokenValidator services.TokenValidator) func(http.Handler) http.Handler {
	return validateTokenMiddleware(tokenValidator, func(r *http.Request, claims *services.TokenClaims) *http.Request {
		serviceInfo := &ServiceInfo{
			ClientID: claims.Subject,
		}
		return SetServiceInfo(r, serviceInfo)
	})
}

// validateTokenMiddleware is a generic middleware for token validation.
func validateTokenMiddleware(tokenValidator services.TokenValidator, onSuccess func(r *http.Request, claims *services.TokenClaims) *http.Request) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tokenString, ok := extractBearerToken(r)
			if !ok {
				slog.Warn("Missing or invalid Authorization header", "path", r.URL.Path, "method", r.Method)
				writeError(w, http.StatusUnauthorized, "Missing or invalid Authorization header")
				return
			}

			claims, err := tokenValidator.ValidateToken(tokenString)
			if err != nil {
				slog.Error("Token validation failed", "error", err, "path", r.URL.Path, "method", r.Method)
				writeError(w, http.StatusUnauthorized, "Invalid or expired token")
				return
			}

			r = onSuccess(r, claims)
			next.ServeHTTP(w, r)
		})
	}
}

// extractBearerToken extracts the token from the Authorization header.
// Returns the token string and true if successful, empty string and false otherwise.
func extractBearerToken(r *http.Request) (string, bool) {
	authHeaderValue := r.Header.Get(authHeader)
	if authHeaderValue == "" {
		return "", false
	}

	parts := strings.SplitN(authHeaderValue, " ", 2)
	if len(parts) != 2 || strings.ToLower(parts[0]) != bearerToken {
		return "", false
	}

	return parts[1], true
}

// Writes an error message as a JSON response with the given status code.
func writeError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"message": message})
}
