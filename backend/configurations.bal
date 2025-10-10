// ============================================================================
// Server Configuration
// ============================================================================

configurable int serverPort = 9090;
configurable int maxHeaderSize = 16384; // Maximum HTTP header size in bytes (16KB default)
configurable int maxEntityBodySize = 50; // Maximum entity body size in MB (default 50MB)

// Server timeout configurations (in seconds)
configurable decimal requestTimeout = 60;
configurable decimal keepAliveTimeout = 120;

// Enable/disable HTTP access logs
configurable boolean enableAccessLogs = true;

// ============================================================================
// Environment Configuration
// ============================================================================

// Environment identifier: dev, staging, production
configurable string environment = "dev";

// Enable debug mode (more verbose logging)
configurable boolean debugMode = false;


// ============================================================================
// TLS/SSL Configuration (Optional - for direct HTTPS)
// ============================================================================
// Note: In production, it's recommended to use an API gateway or load balancer
// for TLS termination rather than handling it directly in the application.

// TLS certificate file path
configurable string tlsCertFile = "";

// TLS private key file path
configurable string tlsKeyFile = "";



// ============================================================================
// CORS Configuration
// ============================================================================

// Allowed origins for CORS (comma-separated in production, or "*" for dev)
configurable string[] allowedOrigins = ["*"];

// Enable CORS credentials
configurable boolean corsAllowCredentials = false;


// ============================================================================
// Health Check Configuration
// ============================================================================

// Enable detailed health check endpoint
configurable boolean enableDetailedHealth = true;

// Include database status in health check
configurable boolean includeDbHealthCheck = true;


