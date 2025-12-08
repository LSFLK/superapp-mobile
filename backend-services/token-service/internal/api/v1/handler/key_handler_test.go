package handler

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// TestKeyHandler_GetJWKS tests JWKS endpoint
func TestKeyHandler_GetJWKS(t *testing.T) {
	tokenService := setupTestTokenService(t)
	handler := NewKeyHandler(tokenService)

	req := httptest.NewRequest(http.MethodGet, "/.well-known/jwks.json", nil)
	w := httptest.NewRecorder()

	handler.GetJWKS(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	contentType := w.Header().Get("Content-Type")
	if contentType != "application/json" {
		t.Errorf("Expected Content-Type application/json, got %s", contentType)
	}

	// Parse JWKS
	var jwks map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &jwks)
	if err != nil {
		t.Fatalf("Failed to parse JWKS: %v", err)
	}

	keys, ok := jwks["keys"].([]interface{})
	if !ok {
		t.Fatal("JWKS keys is not an array")
	}

	// Should have 2 keys (test-key-1 and test-key-2)
	if len(keys) != 2 {
		t.Errorf("Expected 2 keys in JWKS, got %d", len(keys))
	}

	// Verify key structure
	for i, keyInterface := range keys {
		key, ok := keyInterface.(map[string]interface{})
		if !ok {
			t.Fatalf("Key %d is not a map", i)
		}

		requiredFields := []string{"kty", "use", "kid", "n", "e", "alg"}
		for _, field := range requiredFields {
			if _, ok := key[field]; !ok {
				t.Errorf("Key %d missing field %s", i, field)
			}
		}
	}
}
