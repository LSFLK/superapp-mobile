package config

import (
	"fmt"
	"log/slog"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DBUser            string
	DBPassword        string
	DBHost            string
	DBPort            string
	DBName            string
	DBMaxOpenConns    int
	DBMaxIdleConns    int
	DBConnMaxLifetime int // in minutes
	DBConnMaxIdleTime int // in minutes
	DBConnectRetries  int
	ServerPort        string

	FirebaseCredentialsPath string

	// External IDP (Asgardeo) - for user authentication
	ExternalIdPJWKSURL  string
	ExternalIdPIssuer   string
	ExternalIdPAudience string

	// Internal IDP (go-idp) - for service authentication
	InternalIdPBaseURL  string
	InternalIdPIssuer   string
	InternalIdPAudience string
}

func Load() *Config {
	// Load .env file if it exists (optional, won't error if missing)
	if err := godotenv.Load(); err != nil {
		slog.Warn("No .env file found, using environment variables or defaults")
	}

	cfg := &Config{
		DBUser:            getEnv("DB_USER", "root"),
		DBPassword:        getEnvRequired("DB_PASSWORD"), // Required
		DBHost:            getEnv("DB_HOST", "localhost"),
		DBPort:            getEnv("DB_PORT", "3306"),
		DBName:            getEnv("DB_NAME", "testdb"),
		DBMaxOpenConns:    getEnvInt("DB_MAX_OPEN_CONNS", 25),
		DBMaxIdleConns:    getEnvInt("DB_MAX_IDLE_CONNS", 5),
		DBConnMaxLifetime: getEnvInt("DB_CONN_MAX_LIFETIME_MIN", 30),
		DBConnMaxIdleTime: getEnvInt("DB_CONN_MAX_IDLE_TIME_MIN", 5),
		DBConnectRetries:  getEnvInt("DB_CONNECT_RETRIES", 5),
		ServerPort:        getEnv("SERVER_PORT", "9090"),

		FirebaseCredentialsPath: getEnv("FIREBASE_CREDENTIALS_PATH", ""),

		// External IDP (Asgardeo)
		ExternalIdPJWKSURL:  getEnvRequired("EXTERNAL_IDP_JWKS_URL"),
		ExternalIdPIssuer:   getEnvRequired("EXTERNAL_IDP_ISSUER"),
		ExternalIdPAudience: getEnvRequired("EXTERNAL_IDP_AUDIENCE"),

		// Internal IDP (go-idp)
		InternalIdPBaseURL:  getEnvRequired("INTERNAL_IDP_BASE_URL"),
		InternalIdPIssuer:   getEnvRequired("INTERNAL_IDP_ISSUER"),
		InternalIdPAudience: getEnvRequired("INTERNAL_IDP_AUDIENCE"),
	}

	slog.Info("Configuration loaded", "server_port", cfg.ServerPort, "db_host", cfg.DBHost)
	return cfg
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func getEnvRequired(key string) string {
	value := os.Getenv(key)
	if value == "" {
		slog.Error("Missing required environment variable", "key", key)
		// We panic here because the application cannot function without these values.
		// In a production environment, this will cause the pod/container to crash loop,
		// which is preferable to running in an undefined state.
		panic(fmt.Sprintf("Missing required environment variable: %s", key))
	}
	return value
}

func getEnvInt(key string, fallback int) int {
	if value := os.Getenv(key); value != "" {
		var intValue int
		if _, err := fmt.Sscanf(value, "%d", &intValue); err == nil {
			return intValue
		}
		slog.Warn("Invalid integer value for environment variable, using default", "key", key, "value", value, "default", fallback)
	}
	return fallback
}
