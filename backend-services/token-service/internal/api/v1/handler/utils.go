package handler

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
)

const (
	defaultMaxRequestBodySize = 1 << 20 // 1MB
	charset                   = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
)

// writeJSON writes data as JSON to the response with the given status code.
func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// writeError writes a standardized OAuth2 error response.
func writeError(w http.ResponseWriter, status int, errCode, errDescription string) {
	resp := map[string]string{"error": errCode}
	if errDescription != "" {
		resp["error_description"] = errDescription
	}
	writeJSON(w, status, resp)
}

// limitRequestBody limits the size of the request body.
func limitRequestBody(w http.ResponseWriter, r *http.Request, maxBytes int64) {
	if maxBytes == 0 {
		maxBytes = defaultMaxRequestBodySize
	}
	r.Body = http.MaxBytesReader(w, r.Body, maxBytes)
}

func hashSecret(secret string) string {
	// In production, use bcrypt or argon2.
	// For simplicity here use SHA256.
	hash := sha256.Sum256([]byte(secret))
	return hex.EncodeToString(hash[:])
}

// generateSecureSecret generates a cryptographically secure random secret
func generateSecureSecret(length int) (string, error) {
	b := make([]byte, length)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	for i := range b {
		b[i] = charset[b[i]%byte(len(charset))]
	}
	return string(b), nil
}
