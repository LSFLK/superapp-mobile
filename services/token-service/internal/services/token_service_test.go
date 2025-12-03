package services

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v4"
)

const (
	testDataDir = "testdata"
)

// TestNewTokenService tests single-key mode initialization
func TestNewTokenService(t *testing.T) {
	privateKeyPath := filepath.Join(testDataDir, "test-key-1_private.pem")
	publicKeyPath := filepath.Join(testDataDir, "test-key-1_public.pem")
	jwksPath := filepath.Join(testDataDir, "test-key-1_jwks.json")

	ts, err := NewTokenService(privateKeyPath, publicKeyPath, jwksPath, 3600)
	if err != nil {
		t.Fatalf("Failed to create token service: %v", err)
	}

	if ts == nil {
		t.Fatal("Token service is nil")
	}

	if len(ts.privateKeys) != 1 {
		t.Errorf("Expected 1 private key, got %d", len(ts.privateKeys))
	}

	if len(ts.publicKeys) != 1 {
		t.Errorf("Expected 1 public key, got %d", len(ts.publicKeys))
	}

	if ts.activeKeyID != KeyID {
		t.Errorf("Expected active key ID %s, got %s", KeyID, ts.activeKeyID)
	}
}

// TestNewTokenServiceFromDirectory tests directory mode initialization
func TestNewTokenServiceFromDirectory(t *testing.T) {
	ts, err := NewTokenServiceFromDirectory(testDataDir, "test-key-1", 3600)
	if err != nil {
		t.Fatalf("Failed to create token service from directory: %v", err)
	}

	if ts == nil {
		t.Fatal("Token service is nil")
	}

	// Should load both test-key-1 and test-key-2
	if len(ts.privateKeys) != 2 {
		t.Errorf("Expected 2 private keys, got %d", len(ts.privateKeys))
	}

	if len(ts.publicKeys) != 2 {
		t.Errorf("Expected 2 public keys, got %d", len(ts.publicKeys))
	}

	if ts.activeKeyID != "test-key-1" {
		t.Errorf("Expected active key ID test-key-1, got %s", ts.activeKeyID)
	}

	// Verify both keys are loaded
	if _, ok := ts.privateKeys["test-key-1"]; !ok {
		t.Error("test-key-1 not found in private keys")
	}

	if _, ok := ts.privateKeys["test-key-2"]; !ok {
		t.Error("test-key-2 not found in private keys")
	}
}

// TestIssueToken tests token generation
func TestIssueToken(t *testing.T) {
	ts, err := NewTokenServiceFromDirectory(testDataDir, "test-key-1", 3600)
	if err != nil {
		t.Fatalf("Failed to create token service: %v", err)
	}

	clientID := "test-client"
	scopes := "read write"

	tokenString, err := ts.IssueToken(clientID, scopes)
	if err != nil {
		t.Fatalf("Failed to issue token: %v", err)
	}

	if tokenString == "" {
		t.Fatal("Token string is empty")
	}

	// Parse token to verify claims
	token, err := jwt.ParseWithClaims(tokenString, &ServiceClaims{}, func(token *jwt.Token) (interface{}, error) {
		kid, ok := token.Header["kid"].(string)
		if !ok {
			t.Fatal("kid not found in token header")
		}

		if kid != "test-key-1" {
			t.Errorf("Expected kid test-key-1, got %s", kid)
		}

		return ts.publicKeys[kid], nil
	})

	if err != nil {
		t.Fatalf("Failed to parse token: %v", err)
	}

	claims, ok := token.Claims.(*ServiceClaims)
	if !ok {
		t.Fatal("Failed to cast claims")
	}

	if claims.Subject != clientID {
		t.Errorf("Expected subject %s, got %s", clientID, claims.Subject)
	}

	if claims.Scopes != scopes {
		t.Errorf("Expected scopes %s, got %s", scopes, claims.Scopes)
	}

	if claims.Issuer != Issuer {
		t.Errorf("Expected issuer %s, got %s", Issuer, claims.Issuer)
	}
}

// TestSetActiveKey tests key rotation
func TestSetActiveKey(t *testing.T) {
	ts, err := NewTokenServiceFromDirectory(testDataDir, "test-key-1", 3600)
	if err != nil {
		t.Fatalf("Failed to create token service: %v", err)
	}

	// Initially active key is test-key-1
	if ts.activeKeyID != "test-key-1" {
		t.Errorf("Expected active key test-key-1, got %s", ts.activeKeyID)
	}

	// Switch to test-key-2
	err = ts.SetActiveKey("test-key-2")
	if err != nil {
		t.Fatalf("Failed to set active key: %v", err)
	}

	if ts.activeKeyID != "test-key-2" {
		t.Errorf("Expected active key test-key-2, got %s", ts.activeKeyID)
	}

	// Issue token with new key
	tokenString, err := ts.IssueToken("test-client", "read")
	if err != nil {
		t.Fatalf("Failed to issue token: %v", err)
	}

	// Verify token is signed with test-key-2
	token, _ := jwt.Parse(tokenString, nil)
	if token == nil {
		t.Fatal("Failed to parse token header")
	}

	kid, ok := token.Header["kid"].(string)
	if !ok || kid != "test-key-2" {
		t.Errorf("Expected kid test-key-2, got %s", kid)
	}

	// Try to set non-existent key
	err = ts.SetActiveKey("non-existent-key")
	if err == nil {
		t.Error("Expected error when setting non-existent key")
	}
}

// TestGenerateJWKS tests JWKS generation with multiple keys
func TestGenerateJWKS(t *testing.T) {
	ts, err := NewTokenServiceFromDirectory(testDataDir, "test-key-1", 3600)
	if err != nil {
		t.Fatalf("Failed to create token service: %v", err)
	}

	jwksBytes, err := ts.generateJWKS()
	if err != nil {
		t.Fatalf("Failed to generate JWKS: %v", err)
	}

	var jwks map[string]interface{}
	err = json.Unmarshal(jwksBytes, &jwks)
	if err != nil {
		t.Fatalf("Failed to parse JWKS: %v", err)
	}

	keys, ok := jwks["keys"].([]interface{})
	if !ok {
		t.Fatal("JWKS keys is not an array")
	}

	// Should have 2 keys
	if len(keys) != 2 {
		t.Errorf("Expected 2 keys in JWKS, got %d", len(keys))
	}

	// Verify each key has required fields
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

		if key["kty"] != "RSA" {
			t.Errorf("Key %d has wrong kty: %v", i, key["kty"])
		}

		if key["alg"] != "RS256" {
			t.Errorf("Key %d has wrong alg: %v", i, key["alg"])
		}
	}
}

// TestGetJWKS tests JWKS retrieval
func TestGetJWKS(t *testing.T) {
	ts, err := NewTokenServiceFromDirectory(testDataDir, "test-key-1", 3600)
	if err != nil {
		t.Fatalf("Failed to create token service: %v", err)
	}

	jwksBytes, err := ts.GetJWKS()
	if err != nil {
		t.Fatalf("Failed to get JWKS: %v", err)
	}

	if len(jwksBytes) == 0 {
		t.Fatal("JWKS is empty")
	}

	// Verify it's valid JSON
	var jwks map[string]interface{}
	err = json.Unmarshal(jwksBytes, &jwks)
	if err != nil {
		t.Fatalf("JWKS is not valid JSON: %v", err)
	}
}

// TestTokenExpiry tests token expiration
func TestTokenExpiry(t *testing.T) {
	expirySeconds := 1 // 1 second expiry
	ts, err := NewTokenServiceFromDirectory(testDataDir, "test-key-1", expirySeconds)
	if err != nil {
		t.Fatalf("Failed to create token service: %v", err)
	}

	tokenString, err := ts.IssueToken("test-client", "read")
	if err != nil {
		t.Fatalf("Failed to issue token: %v", err)
	}

	// Parse token
	token, err := jwt.ParseWithClaims(tokenString, &ServiceClaims{}, func(token *jwt.Token) (interface{}, error) {
		kid := token.Header["kid"].(string)
		return ts.publicKeys[kid], nil
	})

	if err != nil {
		t.Fatalf("Failed to parse token: %v", err)
	}

	claims := token.Claims.(*ServiceClaims)

	// Verify expiry is set correctly
	expectedExpiry := time.Now().Add(time.Duration(expirySeconds) * time.Second)
	actualExpiry := claims.ExpiresAt.Time

	// Allow 1 second tolerance
	if actualExpiry.Sub(expectedExpiry).Abs() > time.Second {
		t.Errorf("Token expiry mismatch. Expected ~%v, got %v", expectedExpiry, actualExpiry)
	}

	// Wait for token to expire
	time.Sleep(2 * time.Second)

	// Try to parse expired token
	_, err = jwt.ParseWithClaims(tokenString, &ServiceClaims{}, func(token *jwt.Token) (interface{}, error) {
		kid := token.Header["kid"].(string)
		return ts.publicKeys[kid], nil
	})

	if err == nil {
		t.Error("Expected error for expired token")
	}
}

// TestGetExpiry tests expiry getter
func TestGetExpiry(t *testing.T) {
	expirySeconds := 7200
	ts, err := NewTokenServiceFromDirectory(testDataDir, "test-key-1", expirySeconds)
	if err != nil {
		t.Fatalf("Failed to create token service: %v", err)
	}

	if ts.GetExpiry() != expirySeconds {
		t.Errorf("Expected expiry %d, got %d", expirySeconds, ts.GetExpiry())
	}
}

// TestGetActiveKeyID tests active key ID getter
func TestGetActiveKeyID(t *testing.T) {
	ts, err := NewTokenServiceFromDirectory(testDataDir, "test-key-1", 3600)
	if err != nil {
		t.Fatalf("Failed to create token service: %v", err)
	}

	if ts.GetActiveKeyID() != "test-key-1" {
		t.Errorf("Expected active key ID test-key-1, got %s", ts.GetActiveKeyID())
	}
}

// TestInvalidDirectory tests error handling for invalid directory
func TestInvalidDirectory(t *testing.T) {
	_, err := NewTokenServiceFromDirectory("non-existent-dir", "test-key-1", 3600)
	if err == nil {
		t.Error("Expected error for non-existent directory")
	}
}

// TestInvalidActiveKey tests error handling for invalid active key
func TestInvalidActiveKey(t *testing.T) {
	_, err := NewTokenServiceFromDirectory(testDataDir, "non-existent-key", 3600)
	if err == nil {
		t.Error("Expected error for non-existent active key")
	}
}

// TestInvalidKeyFile tests error handling for invalid key files
func TestInvalidKeyFile(t *testing.T) {
	// Create temp directory with invalid key file
	tmpDir, err := os.MkdirTemp("", "test-invalid-keys")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	// Create invalid private key file
	invalidKeyPath := filepath.Join(tmpDir, "invalid_private.pem")
	err = os.WriteFile(invalidKeyPath, []byte("not a valid key"), 0600)
	if err != nil {
		t.Fatalf("Failed to write invalid key: %v", err)
	}

	_, err = NewTokenService(invalidKeyPath, "", "", 3600)
	if err == nil {
		t.Error("Expected error for invalid private key")
	}
}
