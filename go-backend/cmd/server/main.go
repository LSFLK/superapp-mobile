package main

import (
	"fmt"
	"log"
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
	mux := router.NewRouter(db)

	// Start the server
	addr := fmt.Sprintf(":%s", cfg.ServerPort)
	fmt.Printf("Server running on %s\n", addr)
	log.Fatal(http.ListenAndServe(addr, mux))
}
