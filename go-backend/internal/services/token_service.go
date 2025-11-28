package services

import (
	"crypto/rsa"
	"fmt"
	"log/slog"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v4"
)

const (
	Audience = "superapp-api"
)

type TokenService struct {
	privateKey *rsa.PrivateKey
	publicKey  *rsa.PublicKey
	expiry     time.Duration
}

type ServiceClaims struct {
	jwt.RegisteredClaims
	Scopes string `json:"scope"`
}

func NewTokenService(privateKeyPath, publicKeyPath string, expirySeconds int) (*TokenService, error) {
	// Load Private Key
	privKeyBytes, err := os.ReadFile(privateKeyPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read private key: %w", err)
	}
	privateKey, err := jwt.ParseRSAPrivateKeyFromPEM(privKeyBytes)
	if err != nil {
		return nil, fmt.Errorf("failed to parse private key: %w", err)
	}

	// Load Public Key (Optional, but good for validation within same service if needed)
	var publicKey *rsa.PublicKey
	if publicKeyPath != "" {
		pubKeyBytes, err := os.ReadFile(publicKeyPath)
		if err == nil {
			publicKey, err = jwt.ParseRSAPublicKeyFromPEM(pubKeyBytes)
			if err != nil {
				slog.Warn("Failed to parse public key", "error", err)
			}
		} else {
			slog.Warn("Failed to read public key", "error", err)
		}
	}

	return &TokenService{
		privateKey: privateKey,
		publicKey:  publicKey,
		expiry:     time.Duration(expirySeconds) * time.Second,
	}, nil
}

// IssueToken generates a signed JWT for a client
// The clientID serves as both the OAuth client identifier and the microapp identifier (sub claim)
func (s *TokenService) IssueToken(clientID, scopes string) (string, error) {
	now := time.Now()
	claims := ServiceClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    "superapp-backend",
			Subject:   clientID, // This is the microapp ID
			Audience:  jwt.ClaimStrings{Audience},
			ExpiresAt: jwt.NewNumericDate(now.Add(s.expiry)),
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
		},
		Scopes: scopes,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	return token.SignedString(s.privateKey)
}

// ValidateToken validates the JWT and returns claims
func (s *TokenService) ValidateToken(tokenString string) (*ServiceClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &ServiceClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		// If we have the public key loaded, use it.
		// In a real distributed scenario, the public key might be fetched from a JWKS endpoint.
		// Since this is the issuer itself validating (or a service with the public key), we use the loaded key.
		if s.publicKey == nil {
			// Fallback: extract public key from private key if not explicitly loaded
			return &s.privateKey.PublicKey, nil
		}
		return s.publicKey, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*ServiceClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}

// GetExpiry returns the token expiry duration in seconds
func (s *TokenService) GetExpiry() int {
	return int(s.expiry.Seconds())
}
