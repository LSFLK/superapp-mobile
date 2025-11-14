package handler

import (
	"encoding/json"
	"net/http"
)

// Writes the given data as JSON to the HTTP response.
func writeJSON(w http.ResponseWriter, data any) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}
