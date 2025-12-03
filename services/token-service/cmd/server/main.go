package main

import (
	"log/slog"
	"net/http"
	"os"

	"go-idp/internal/api/v1/router"
	"go-idp/internal/config"
	"go-idp/internal/services"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main() {
	cfg := config.Load()

	// Initialize Logger
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	// Connect to Database
	db, err := gorm.Open(mysql.Open(cfg.DBDSN), &gorm.Config{})
	if err != nil {
		slog.Error("Failed to connect to database", "error", err)
		os.Exit(1)
	}

	// Initialize Token Service
	// Choose between directory mode (zero-downtime rotation) or single-key mode (backward compatible)
	var tokenService *services.TokenService
	if cfg.KeysDir != "" {
		// Directory mode: Load all keys from directory
		slog.Info("Initializing token service in directory mode", "keys_dir", cfg.KeysDir, "active_key", cfg.ActiveKeyID)
		tokenService, err = services.NewTokenServiceFromDirectory(cfg.KeysDir, cfg.ActiveKeyID, cfg.TokenExpiry)
		if err != nil {
			slog.Error("Failed to initialize token service from directory", "error", err)
			os.Exit(1)
		}
	} else {
		// Single-key mode: Load single key pair (backward compatible)
		slog.Info("Initializing token service in single-key mode", "key_id", cfg.ActiveKeyID)
		tokenService, err = services.NewTokenService(cfg.PrivateKeyPath, cfg.PublicKeyPath, cfg.JWKSPath, cfg.TokenExpiry)
		if err != nil {
			slog.Error("Failed to initialize token service", "error", err)
			os.Exit(1)
		}

		// Set active key from config (allows override via environment variable)
		if cfg.ActiveKeyID != "" {
			if err := tokenService.SetActiveKey(cfg.ActiveKeyID); err != nil {
				slog.Warn("Failed to set active key from config, using default", "error", err, "default_key", tokenService.GetActiveKeyID())
			}
		}
	}

	// Initialize Router
	r := router.NewRouter(db, tokenService)

	// Start Server
	slog.Info("Starting IdP Service", "port", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		slog.Error("Server failed", "error", err)
		os.Exit(1)
	}
}
