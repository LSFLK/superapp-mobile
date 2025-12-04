package services

import (
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log/slog"
	"math/big"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v4"
)

const (
	Audience = "superapp-api"
	Issuer   = "superapp-idp"
	KeyID    = "superapp-key-1"
)

type TokenService struct {
	privateKeys map[string]*rsa.PrivateKey // kid -> private key
	publicKeys  map[string]*rsa.PublicKey  // kid -> public key
	activeKeyID string                     // Current signing key
	jwksData    []byte
	expiry      time.Duration
}

type ServiceClaims struct {
	jwt.RegisteredClaims
	Scopes string `json:"scope"`
}

// NewTokenService creates a TokenService with support for multiple keys
// It can load keys in two modes:
// 1. Single key mode (backward compatible): privateKeyPath, publicKeyPath, jwksPath
// 2. Directory mode: keysDir containing multiple key pairs
func NewTokenService(privateKeyPath, publicKeyPath, jwksPath string, expirySeconds int) (*TokenService, error) {
	ts := &TokenService{
		privateKeys: make(map[string]*rsa.PrivateKey),
		publicKeys:  make(map[string]*rsa.PublicKey),
		activeKeyID: KeyID, // Default to the constant
		expiry:      time.Duration(expirySeconds) * time.Second,
	}

	// Load Private Key (single key mode for backward compatibility)
	privKeyBytes, err := os.ReadFile(privateKeyPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read private key: %w", err)
	}
	privateKey, err := jwt.ParseRSAPrivateKeyFromPEM(privKeyBytes)
	if err != nil {
		return nil, fmt.Errorf("failed to parse private key: %w", err)
	}
	ts.privateKeys[KeyID] = privateKey

	// Load Public Key
	var publicKey *rsa.PublicKey
	if publicKeyPath != "" {
		pubKeyBytes, err := os.ReadFile(publicKeyPath)
		if err == nil {
			publicKey, err = jwt.ParseRSAPublicKeyFromPEM(pubKeyBytes)
			if err != nil {
				slog.Warn("Failed to parse public key", "error", err)
			} else {
				ts.publicKeys[KeyID] = publicKey
			}
		} else {
			slog.Warn("Failed to read public key", "error", err)
		}
	}

	// Load and update JWKS file with actual public key N value
	var jwksData []byte
	if jwksPath != "" && publicKey != nil {
		jwksData, err = loadAndUpdateJWKS(jwksPath, publicKey)
		if err != nil {
			slog.Warn("Failed to load JWKS file, will generate dynamically", "error", err)
		}
	}
	ts.jwksData = jwksData

	return ts, nil
}

// NewTokenServiceFromDirectory creates a TokenService by loading all keys from a directory
// This enables zero-downtime key rotation by loading multiple keys simultaneously
func NewTokenServiceFromDirectory(keysDir string, activeKeyID string, expirySeconds int) (*TokenService, error) {
	ts := &TokenService{
		privateKeys: make(map[string]*rsa.PrivateKey),
		publicKeys:  make(map[string]*rsa.PublicKey),
		activeKeyID: activeKeyID,
		expiry:      time.Duration(expirySeconds) * time.Second,
	}

	// Read all files in the directory
	entries, err := os.ReadDir(keysDir)
	if err != nil {
		return nil, fmt.Errorf("failed to read keys directory: %w", err)
	}

	keysLoaded := 0
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		filename := entry.Name()

		// Look for private key files (format: {keyid}_private.pem)
		if !strings.HasSuffix(filename, "_private.pem") {
			continue
		}

		// Extract key ID from filename
		keyID := strings.TrimSuffix(filename, "_private.pem")

		// Load private key
		privKeyPath := filepath.Join(keysDir, filename)
		privKeyBytes, err := os.ReadFile(privKeyPath)
		if err != nil {
			slog.Warn("Failed to read private key", "key_id", keyID, "error", err)
			continue
		}

		privateKey, err := jwt.ParseRSAPrivateKeyFromPEM(privKeyBytes)
		if err != nil {
			slog.Warn("Failed to parse private key", "key_id", keyID, "error", err)
			continue
		}
		ts.privateKeys[keyID] = privateKey

		// Load corresponding public key
		pubKeyPath := filepath.Join(keysDir, keyID+"_public.pem")
		pubKeyBytes, err := os.ReadFile(pubKeyPath)
		if err == nil {
			publicKey, err := jwt.ParseRSAPublicKeyFromPEM(pubKeyBytes)
			if err == nil {
				ts.publicKeys[keyID] = publicKey
			} else {
				slog.Warn("Failed to parse public key", "key_id", keyID, "error", err)
			}
		}

		keysLoaded++
		slog.Info("Loaded key pair", "key_id", keyID)
	}

	if keysLoaded == 0 {
		return nil, fmt.Errorf("no valid key pairs found in directory: %s", keysDir)
	}

	// Verify active key exists
	if _, ok := ts.privateKeys[activeKeyID]; !ok {
		return nil, fmt.Errorf("active key %s not found in loaded keys", activeKeyID)
	}

	// Generate JWKS from all public keys
	ts.jwksData, err = ts.generateJWKS()
	if err != nil {
		slog.Warn("Failed to generate JWKS", "error", err)
	}

	slog.Info("Token service initialized from directory",
		"keys_loaded", keysLoaded,
		"active_key", activeKeyID)

	return ts, nil
}

// loadAndUpdateJWKS loads the JWKS template and updates the N value from the public key
func loadAndUpdateJWKS(jwksPath string, publicKey *rsa.PublicKey) ([]byte, error) {
	data, err := os.ReadFile(jwksPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read JWKS file: %w", err)
	}

	var jwks map[string]interface{}
	if err := json.Unmarshal(data, &jwks); err != nil {
		return nil, fmt.Errorf("failed to parse JWKS file: %w", err)
	}

	// Update the N value in the first key
	keys, ok := jwks["keys"].([]interface{})
	if !ok || len(keys) == 0 {
		return nil, fmt.Errorf("invalid JWKS format")
	}

	key, ok := keys[0].(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("invalid key format in JWKS")
	}

	// Set N from public key
	nStr := base64.RawURLEncoding.EncodeToString(publicKey.N.Bytes())
	key["n"] = nStr

	return json.Marshal(jwks)
}

// generateJWKS creates a JWKS containing all loaded public keys
// This enables validators to verify tokens signed by any of the loaded keys
func (s *TokenService) generateJWKS() ([]byte, error) {
	keys := make([]map[string]interface{}, 0, len(s.publicKeys))

	for keyID, publicKey := range s.publicKeys {
		// Encode N (modulus) as base64url
		nBytes := publicKey.N.Bytes()
		nStr := base64.RawURLEncoding.EncodeToString(nBytes)

		// Encode E (exponent) as base64url
		eBytes := big.NewInt(int64(publicKey.E)).Bytes()
		eStr := base64.RawURLEncoding.EncodeToString(eBytes)

		keys = append(keys, map[string]interface{}{
			"kty": "RSA",
			"use": "sig",
			"kid": keyID,
			"n":   nStr,
			"e":   eStr,
			"alg": "RS256",
		})
	}

	jwks := map[string]interface{}{
		"keys": keys,
	}

	return json.Marshal(jwks)
}

// IssueToken generates a signed JWT for a client
// The clientID serves as both the OAuth client identifier and the microapp identifier (sub claim)
func (s *TokenService) IssueToken(clientID, scopes string) (string, error) {
	now := time.Now()
	claims := ServiceClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    Issuer,
			Subject:   clientID, // This is the microapp ID
			Audience:  jwt.ClaimStrings{Audience},
			ExpiresAt: jwt.NewNumericDate(now.Add(s.expiry)),
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
		},
		Scopes: scopes,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	token.Header["kid"] = s.activeKeyID

	// Get the active private key
	privateKey, ok := s.privateKeys[s.activeKeyID]
	if !ok {
		return "", fmt.Errorf("active key %s not found", s.activeKeyID)
	}

	return token.SignedString(privateKey)
}

// GetJWKS returns the cached JWKS data
func (s *TokenService) GetJWKS() ([]byte, error) {
	if len(s.jwksData) == 0 {
		return nil, fmt.Errorf("JWKS not available")
	}
	return s.jwksData, nil
}

// GetExpiry returns the token expiry duration in seconds
func (s *TokenService) GetExpiry() int {
	return int(s.expiry.Seconds())
}

// SetActiveKey sets the active signing key
// This allows for key rotation without restarting the service
func (s *TokenService) SetActiveKey(keyID string) error {
	if _, ok := s.privateKeys[keyID]; !ok {
		return fmt.Errorf("key %s not found in private keys", keyID)
	}
	s.activeKeyID = keyID
	slog.Info("Active signing key updated", "key_id", keyID)
	return nil
}

// GetActiveKeyID returns the current active key ID
func (s *TokenService) GetActiveKeyID() string {
	return s.activeKeyID
}
