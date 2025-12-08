package services

import (
	"context"
	"encoding/json"
)

// TokenValidator defines the interface for token validation services
type TokenValidator interface {
	ValidateToken(tokenString string) (*TokenClaims, error)
	GetJWKS() (json.RawMessage, error)
}

// NotificationService defines the interface for sending notifications
type NotificationService interface {
	SendNotificationToMultiple(ctx context.Context, tokens []string, title string, body string, data map[string]string) (int, int, error)
}
