package config

import (
	"fmt"
	"log/slog"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DBUser         string
	DBPassword     string
	DBHost         string
	DBPort         string
	DBName         string
	DBMaxOpenConns int
	DBMaxIdleConns int
	ServerPort     string

	JWKSURL     string
	JWTIssuer   string
	JWTAudience string

	FirebaseCredentialsPath string

	// OAuth2 Config - Reuses the same keys as user JWT validation
	// For production: Use JWKS URL or load keys from the same source as user auth
	JWTPrivateKeyPath string // Path to private key for signing service tokens
	JWTPublicKeyPath  string // Optional: public key for validation
	TokenExpiry       int    // Seconds
}

func Load() *Config {
	// Load .env file if it exists (optional, won't error if missing)
	if err := godotenv.Load(); err != nil {
		slog.Warn("No .env file found, using environment variables or defaults")
	}

	cfg := &Config{
		DBUser:         getEnv("DB_USER", "root"),
		DBPassword:     getEnv("DB_PASSWORD", ""),
		DBHost:         getEnv("DB_HOST", "localhost"),
		DBPort:         getEnv("DB_PORT", "3306"),
		DBName:         getEnv("DB_NAME", "testdb"),
		DBMaxOpenConns: getEnvInt("DB_MAX_OPEN_CONNS", 25),
		DBMaxIdleConns: getEnvInt("DB_MAX_IDLE_CONNS", 5),
		ServerPort:     getEnv("SERVER_PORT", "9090"),

		JWKSURL:     getEnv("JWKS_URL", "fallback <idp-metadata-url>/jwks"),
		JWTIssuer:   getEnv("JWT_ISSUER", "fallback <idp-issuer-url>"),
		JWTAudience: getEnv("JWT_AUDIENCE", "fallback <target-audience-in-token>"),

		FirebaseCredentialsPath: getEnv("FIREBASE_CREDENTIALS_PATH", ""),

		JWTPrivateKeyPath: getEnv("JWT_PRIVATE_KEY_PATH", "private_key.pem"),
		JWTPublicKeyPath:  getEnv("JWT_PUBLIC_KEY_PATH", "public_key.pem"),
		TokenExpiry:       getEnvInt("TOKEN_EXPIRY", 120),
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
