import ballerina/time;

// Service configuration (override via Config.toml or env vars)
configurable int serverPort = 9090;
configurable string environment = "development";
configurable string serviceVersion = "1.0.0";

// Authentication configuration
configurable boolean authEnabled = false; // Set to true to enable authentication
configurable string jwtSecret = "your-secret-key-change-in-production";
configurable int tokenExpirySeconds = 3600; // 1 hour

// Public endpoints that don't require authentication
public string[] publicEndpoints = ["/api/v1/payslips/health"];

// Authentication configuration object used across the service
public AuthConfig authConfig = {
    enabled: authEnabled,
    jwtSecret: authEnabled ? jwtSecret : (),
    tokenExpirySeconds: tokenExpirySeconds,
    publicEndpoints: publicEndpoints
};

// Service start time for uptime calculation
public time:Utc serviceStartTime = time:utcNow();

// Database configuration
public type DatabaseConfig record {
    string DB_HOST;
    int DB_PORT;
    string DB_NAME;
    string DB_USER;
    string DB_PASSWORD;
};

// Provide this via a local Config.toml:
// [databaseConfig]
// DB_HOST = "127.0.0.1"
// DB_PORT = 3306
// DB_NAME = "payslip_db"
// DB_USER = "root"
// DB_PASSWORD = ""
public configurable DatabaseConfig databaseConfig = ?;
