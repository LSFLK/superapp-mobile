package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
)

// Writes the given data as JSON to the HTTP response with the specified status code.
func writeJSON(w http.ResponseWriter, status int, data any) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		return fmt.Errorf("failed to encode JSON: %w", err)
	}
	return nil
}

// Checks that the required string fields are not empty.
func validateRequiredStrings(w http.ResponseWriter, fields map[string]string) bool {
	for fieldName, fieldValue := range fields {
		if fieldValue == "" {
			http.Error(w, fmt.Sprintf("%s is required", fieldName), http.StatusBadRequest)
			return false
		}
	}
	return true
}

// Validates that the Content-Type header is application/json.
func validateContentType(w http.ResponseWriter, r *http.Request) bool {
	contentType := r.Header.Get("Content-Type")
	if contentType != "application/json" {
		http.Error(w, "Content-Type must be application/json", http.StatusUnsupportedMediaType)
		return false
	}
	return true
}

// Limits the size of the request body to prevent large payloads.
func limitRequestBody(w http.ResponseWriter, r *http.Request, maxBytes int64) {
	if maxBytes == 0 {
		maxBytes = 1 << 20 // 1MB default
	}
	r.Body = http.MaxBytesReader(w, r.Body, maxBytes)
}
