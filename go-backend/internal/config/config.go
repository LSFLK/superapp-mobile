package config

import (
	"log"
	"os"
)

type Config struct {
	DBUser     string
	DBPassword string
	DBHost     string
	DBPort     string
	DBName     string
	ServerPort string

	JWKSURL     string
	JWTIssuer   string
	JWTAudience string
}

func Load() *Config {
	cfg := &Config{
		DBUser:     getEnv("DB_USER", "root"),
		DBPassword: getEnv("DB_PASSWORD", ""),
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "3306"),
		DBName:     getEnv("DB_NAME", "testdb"),
		ServerPort: getEnv("SERVER_PORT", "9090"),

		JWKSURL:     getEnv("JWKS_URL", "fallback <idp-metadata-url>/jwks"),
		JWTIssuer:   getEnv("JWT_ISSUER", "fallback <idp-issuer-url>"),
		JWTAudience: getEnv("JWT_AUDIENCE", "fallback <target-audience-in-token>"),
	}

	log.Println("Configuration loaded")
	return cfg
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
