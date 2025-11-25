package main

import (
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
	var fcmService *services.FCMService
	var err error
	if cfg.FirebaseCredentialsPath != "" {
		fcmService, err = services.NewFCMService(cfg.FirebaseCredentialsPath)
		if err != nil {
			slog.Warn("Failed to initialize FCM service, notifications will be disabled", "error", err)
			fcmService = nil
		}
	} else {
		slog.Warn("Firebase credentials path not configured, notifications will be disabled")
		fcmService = nil
	}

	// Initialize HTTP routes
	mux := router.NewRouter(db, cfg, fcmService)

	// Start the server
	slog.Info("Starting server", "port", cfg.ServerPort)
	log.Fatal(http.ListenAndServe(":"+cfg.ServerPort, mux))
}
