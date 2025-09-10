import ballerina/time;

// Service configuration
configurable int serverPort = 8080;
configurable string environment = "development";
configurable string serviceVersion = "1.0.0";

// Authentication configuration
configurable boolean authEnabled = false; // Set to true to enable authentication
configurable string jwtSecret = "your-secret-key-change-in-production";
configurable int tokenExpirySeconds = 3600; // 1 hour

// Public endpoints that don't require authentication
public string[] publicEndpoints = ["/api/v1/payslips/health"];

// Authentication configuration
public AuthConfig authConfig = {
    enabled: authEnabled,
    jwtSecret: authEnabled ? jwtSecret : (),
    tokenExpirySeconds: tokenExpirySeconds,
    publicEndpoints: publicEndpoints
};

// Service start time for uptime calculation
public time:Utc serviceStartTime = time:utcNow();
