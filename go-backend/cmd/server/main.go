package main

import (
	"log"
	"log/slog"
	"net/http"

	"go-backend/internal/config"
	"go-backend/internal/database"
	"go-backend/internal/router"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Connect to the database
	db := database.Connect(cfg)
	defer database.Close(db)

	// Initialize HTTP routes
	mux := router.NewRouter(db, cfg)

	// Start the server
	slog.Info("Starting server", "port", cfg.ServerPort)
	log.Fatal(http.ListenAndServe(":"+cfg.ServerPort, mux))
}
