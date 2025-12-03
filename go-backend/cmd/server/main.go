package main

import (
	"fmt"
	"log"
	"log/slog"
	"net/http"

	"go-backend/internal/config"
	"go-backend/internal/database"
	"go-backend/internal/router"
	"go-backend/internal/services"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Connect to the database
	db := database.Connect(cfg)
	defer database.Close(db)

	// Initialize FCM service
	fcmService, err := initializeFCMService(cfg.FirebaseCredentialsPath)
	if err != nil {
		slog.Error("Failed to initialize FCM service", "error", err)
	} else {
		slog.Info("FCM service initialized successfully")
	}
	// Initialize HTTP routes
	mux := router.NewRouter(db, cfg, fcmService)

	// Start the server
	slog.Info("Starting server", "port", cfg.ServerPort)
	log.Fatal(http.ListenAndServe(":"+cfg.ServerPort, mux))
}

func initializeFCMService(credentialsPath string) (*services.FCMService, error) {
	if credentialsPath == "" {
		return nil, fmt.Errorf("firebase credentials path not configured")
	}
	return services.NewFCMService(credentialsPath)
}
