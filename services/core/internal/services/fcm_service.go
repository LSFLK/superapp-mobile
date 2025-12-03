package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/messaging"
	"google.golang.org/api/option"
)

type FCMService struct {
	client *messaging.Client
}

// NewFCMService initializes a new FCM service with Firebase Admin SDK
func NewFCMService(credentialsPath string) (*FCMService, error) {
	ctx := context.Background()

	var app *firebase.App
	var err error

	if credentialsPath != "" {
		// Initialize with credentials file and extract project ID
		opt := option.WithCredentialsFile(credentialsPath)

		// Read project ID from credentials file
		var projectID string
		projectID, err = getProjectIDFromCredentials(credentialsPath)
		if err != nil {
			return nil, fmt.Errorf("error reading project ID from credentials: %w", err)
		}

		config := &firebase.Config{
			ProjectID: projectID,
		}

		app, err = firebase.NewApp(ctx, config, opt)
	} else {
		// Initialize with default credentials (for Cloud Run, etc.)
		app, err = firebase.NewApp(ctx, nil)
	}

	if err != nil {
		return nil, fmt.Errorf("error initializing firebase app: %w", err)
	}

	client, err := app.Messaging(ctx)
	if err != nil {
		return nil, fmt.Errorf("error getting messaging client: %w", err)
	}

	slog.Info("FCM service initialized successfully")
	return &FCMService{client: client}, nil
}

// SendNotificationToMultiple sends a notification to multiple devices
func (s *FCMService) SendNotificationToMultiple(
	ctx context.Context,
	tokens []string,
	title string,
	body string,
	data map[string]string,
) (int, int, error) {
	if len(tokens) == 0 {
		return 0, 0, nil
	}

	message := &messaging.MulticastMessage{
		Tokens: tokens,
		Notification: &messaging.Notification{
			Title: title,
			Body:  body,
		},
		Data: data,
		APNS: &messaging.APNSConfig{
			Payload: &messaging.APNSPayload{
				Aps: &messaging.Aps{
					Sound: "default",
					Badge: intPtr(1),
				},
			},
		},
		Android: &messaging.AndroidConfig{
			Priority: "high",
			Notification: &messaging.AndroidNotification{
				Sound:        "default",
				ChannelID:    "default",
				Priority:     messaging.PriorityHigh,
				DefaultSound: true,
			},
		},
	}

	response, err := s.client.SendEachForMulticast(ctx, message)
	if err != nil {
		return 0, 0, fmt.Errorf("error sending multicast message: %w", err)
	}

	slog.Info("Successfully sent multicast message",
		"success_count", response.SuccessCount,
		"failure_count", response.FailureCount,
		"total_tokens", len(tokens))

	return response.SuccessCount, response.FailureCount, nil
}

// Helper functions

func intPtr(i int) *int {
	return &i
}

// getProjectIDFromCredentials reads the project_id from the Firebase credentials JSON file
func getProjectIDFromCredentials(credentialsPath string) (string, error) {
	data, err := os.ReadFile(credentialsPath)
	if err != nil {
		return "", fmt.Errorf("failed to read credentials file: %w", err)
	}

	var creds struct {
		ProjectID string `json:"project_id"`
	}

	if err := json.Unmarshal(data, &creds); err != nil {
		return "", fmt.Errorf("failed to parse credentials JSON: %w", err)
	}

	if creds.ProjectID == "" {
		return "", fmt.Errorf("project_id not found in credentials file")
	}

	return creds.ProjectID, nil
}
