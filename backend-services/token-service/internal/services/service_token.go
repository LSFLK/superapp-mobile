package services

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v4"
)

const (
	Audience = "superapp-api"
)

// ServiceClaims represents claims for a service-to-service token
type ServiceClaims struct {
	jwt.RegisteredClaims
	Scopes string `json:"scope"`
}

// IssueToken generates a signed JWT for a client (service-to-service authentication)
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

	s.mu.RLock()
	activeKeyID := s.activeKeyID
	privateKey, ok := s.privateKeys[activeKeyID]
	s.mu.RUnlock()

	if !ok {
		return "", fmt.Errorf("active key %s not found", activeKeyID)
	}

	token.Header["kid"] = activeKeyID
	return token.SignedString(privateKey)
}
