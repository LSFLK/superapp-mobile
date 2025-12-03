package handler

import (
	"encoding/json"
	"net/http"
)

const (
	defaultMaxRequestBodySize = 1 << 20 // 1MB
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
