package config

import (
	"fmt"
	"os"
	"strconv"
)

type Config struct {
	Port           string
	DBUser         string
	DBPassword     string
	DBHost         string
	DBPort         string
	DBName         string
	DBDSN          string
	PrivateKeyPath string
	PublicKeyPath  string
	JWKSPath       string
	KeysDir        string // Directory containing multiple key pairs (for zero-downtime rotation)
	ActiveKeyID    string
	TokenExpiry    int
}

func Load() *Config {
	cfg := &Config{
		Port:           getEnv("PORT", "8081"),
		DBUser:         getEnv("DB_USER", "root"),
		DBPassword:     getEnv("DB_PASSWORD", "password"),
		DBHost:         getEnv("DB_HOST", "127.0.0.1"),
		DBPort:         getEnv("DB_PORT", "3306"),
		DBName:         getEnv("DB_NAME", "superapp"),
		PrivateKeyPath: getEnv("PRIVATE_KEY_PATH", "private_key.pem"),
		PublicKeyPath:  getEnv("PUBLIC_KEY_PATH", "public_key.pem"),
		JWKSPath:       getEnv("JWKS_PATH", "jwks.json"),
		KeysDir:        getEnv("KEYS_DIR", ""), // Empty means use single-key mode
		ActiveKeyID:    getEnv("ACTIVE_KEY_ID", "superapp-key-1"),
		TokenExpiry:    getEnvAsInt("TOKEN_EXPIRY_SECONDS", 3600),
	}

	// Construct DSN
	// Format: user:password@tcp(host:port)/dbname?charset=utf8mb4&parseTime=True&loc=Local
	cfg.DBDSN = fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName)

	return cfg
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func getEnvAsInt(key string, fallback int) int {
	if value, ok := os.LookupEnv(key); ok {
		if i, err := strconv.Atoi(value); err == nil {
			return i
		}
	}
	return fallback
}
