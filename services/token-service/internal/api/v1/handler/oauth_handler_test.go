package handler

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"go-idp/internal/models"
	"go-idp/internal/services"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// setupTestDB creates an in-memory SQLite database for testing
func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to open test database: %v", err)
	}

	// Auto-migrate models
	err = db.AutoMigrate(&models.OAuth2Client{})
	if err != nil {
		t.Fatalf("Failed to migrate database: %v", err)
	}

	return db
}

// seedTestClient creates a test OAuth2 client
func seedTestClient(t *testing.T, db *gorm.DB) *models.OAuth2Client {
	// Hash the secret using SHA256 (same as in handler)
	secret := "test-secret"
	hash := sha256.Sum256([]byte(secret))
	hashedSecret := hex.EncodeToString(hash[:])

	client := &models.OAuth2Client{
		ClientID:     "test-client",
		ClientSecret: hashedSecret,
		Name:         "Test Client",
		Scopes:       "read write",
		IsActive:     true,
	}

	result := db.Create(client)
	if result.Error != nil {
		t.Fatalf("Failed to seed test client: %v", result.Error)
	}

	return client
}

// setupTestTokenService creates a test token service
func setupTestTokenService(t *testing.T) *services.TokenService {
	ts, err := services.NewTokenServiceFromDirectory("../../../services/testdata", "test-key-1", 3600)
	if err != nil {
		t.Fatalf("Failed to create test token service: %v", err)
	}
	return ts
}

// TestOAuthHandler_Token_JSON tests token endpoint with JSON body
func TestOAuthHandler_Token_JSON(t *testing.T) {
	db := setupTestDB(t)
	seedTestClient(t, db)
	tokenService := setupTestTokenService(t)

	handler := NewOAuthHandler(db, tokenService)

	reqBody := TokenRequest{
		GrantType:    "client_credentials",
		ClientID:     "test-client",
		ClientSecret: "test-secret",
	}

	body, _ := json.Marshal(reqBody)
	req := httptest.NewRequest(http.MethodPost, "/oauth/token", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	handler.Token(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d. Body: %s", w.Code, w.Body.String())
	}

	var resp TokenResponse
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	if err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if resp.AccessToken == "" {
		t.Error("Access token is empty")
	}

	if resp.TokenType != "Bearer" {
		t.Errorf("Expected token type Bearer, got %s", resp.TokenType)
	}

	if resp.ExpiresIn != 3600 {
		t.Errorf("Expected expires_in 3600, got %d", resp.ExpiresIn)
	}
}

// TestOAuthHandler_Token_Form tests token endpoint with form data
func TestOAuthHandler_Token_Form(t *testing.T) {
	db := setupTestDB(t)
	seedTestClient(t, db)
	tokenService := setupTestTokenService(t)

	handler := NewOAuthHandler(db, tokenService)

	formData := url.Values{}
	formData.Set("grant_type", "client_credentials")
	formData.Set("client_id", "test-client")
	formData.Set("client_secret", "test-secret")

	req := httptest.NewRequest(http.MethodPost, "/oauth/token", strings.NewReader(formData.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	w := httptest.NewRecorder()
	handler.Token(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d. Body: %s", w.Code, w.Body.String())
	}

	var resp TokenResponse
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	if err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if resp.AccessToken == "" {
		t.Error("Access token is empty")
	}
}

// TestOAuthHandler_Token_BasicAuth tests token endpoint with Basic Auth
func TestOAuthHandler_Token_BasicAuth(t *testing.T) {
	db := setupTestDB(t)
	seedTestClient(t, db)
	tokenService := setupTestTokenService(t)

	handler := NewOAuthHandler(db, tokenService)

	formData := url.Values{}
	formData.Set("grant_type", "client_credentials")

	req := httptest.NewRequest(http.MethodPost, "/oauth/token", strings.NewReader(formData.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.SetBasicAuth("test-client", "test-secret")

	w := httptest.NewRecorder()
	handler.Token(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d. Body: %s", w.Code, w.Body.String())
	}
}

// TestOAuthHandler_Token_InvalidGrant tests invalid grant type
func TestOAuthHandler_Token_InvalidGrant(t *testing.T) {
	db := setupTestDB(t)
	tokenService := setupTestTokenService(t)

	handler := NewOAuthHandler(db, tokenService)

	reqBody := TokenRequest{
		GrantType:    "password",
		ClientID:     "test-client",
		ClientSecret: "test-secret",
	}

	body, _ := json.Marshal(reqBody)
	req := httptest.NewRequest(http.MethodPost, "/oauth/token", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	handler.Token(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", w.Code)
	}

	var errResp map[string]string
	json.Unmarshal(w.Body.Bytes(), &errResp)

	if errResp["error"] != "unsupported_grant_type" {
		t.Errorf("Expected error unsupported_grant_type, got %s", errResp["error"])
	}
}

// TestOAuthHandler_Token_InvalidClient tests invalid client credentials
func TestOAuthHandler_Token_InvalidClient(t *testing.T) {
	db := setupTestDB(t)
	seedTestClient(t, db)
	tokenService := setupTestTokenService(t)

	handler := NewOAuthHandler(db, tokenService)

	reqBody := TokenRequest{
		GrantType:    "client_credentials",
		ClientID:     "test-client",
		ClientSecret: "wrong-secret",
	}

	body, _ := json.Marshal(reqBody)
	req := httptest.NewRequest(http.MethodPost, "/oauth/token", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	handler.Token(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("Expected status 401, got %d", w.Code)
	}

	var errResp map[string]string
	json.Unmarshal(w.Body.Bytes(), &errResp)

	if errResp["error"] != "invalid_client" {
		t.Errorf("Expected error invalid_client, got %s", errResp["error"])
	}
}

// TestOAuthHandler_Token_InactiveClient tests inactive client
func TestOAuthHandler_Token_InactiveClient(t *testing.T) {
	db := setupTestDB(t)
	client := seedTestClient(t, db)

	// Deactivate client
	client.IsActive = false
	db.Save(client)

	tokenService := setupTestTokenService(t)
	handler := NewOAuthHandler(db, tokenService)

	reqBody := TokenRequest{
		GrantType:    "client_credentials",
		ClientID:     "test-client",
		ClientSecret: "test-secret",
	}

	body, _ := json.Marshal(reqBody)
	req := httptest.NewRequest(http.MethodPost, "/oauth/token", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	handler.Token(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("Expected status 401, got %d", w.Code)
	}
}

// TestOAuthHandler_Token_MissingCredentials tests missing credentials
func TestOAuthHandler_Token_MissingCredentials(t *testing.T) {
	db := setupTestDB(t)
	tokenService := setupTestTokenService(t)

	handler := NewOAuthHandler(db, tokenService)

	reqBody := TokenRequest{
		GrantType: "client_credentials",
		// Missing ClientID and ClientSecret
	}

	body, _ := json.Marshal(reqBody)
	req := httptest.NewRequest(http.MethodPost, "/oauth/token", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	handler.Token(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", w.Code)
	}
}
