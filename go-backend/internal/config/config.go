package config

import (
	"fmt"
	"log/slog"
	"os"
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

	FileServiceType string
	BaseURL         string
}

func Load() *Config {
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

		FileServiceType: getEnv("FILE_SERVICE_TYPE", "db"),
		BaseURL:         getEnv("BASE_URL", "http://localhost:9090"),
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
