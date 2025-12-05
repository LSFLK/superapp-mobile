package services

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v4"
)

// UserContextClaims represents claims for a user-context token
type UserContextClaims struct {
	jwt.RegisteredClaims
	MicroappID string `json:"microapp_id"`
	Scopes     string `json:"scope,omitempty"`
}

// GenerateUserToken generates a token for a microapp frontend with user context
// This is used when a microapp frontend needs to call its own backend
func (s *TokenService) GenerateUserToken(userEmail, microappID, scopes string) (string, error) {
	now := time.Now()
	claims := UserContextClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    Issuer,
			Subject:   userEmail,                    // User email as subject (who the token represents)
			Audience:  jwt.ClaimStrings{microappID}, // Microapp ID as audience (intended recipient)
			ExpiresAt: jwt.NewNumericDate(now.Add(s.expiry)),
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
		},
		MicroappID: microappID,
		Scopes:     scopes,
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
