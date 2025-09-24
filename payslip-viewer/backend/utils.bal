// ==============================
//           Utilities
// ==============================
// Provides helper functions for:
// - Health check responses
// - Public endpoint identification
// - Logging incoming requests
// ==============================

import ballerina/log;
import ballerina/time;

configurable string serviceVersion = "1.0.0";

// Health check utilities
public function createHealthResponse() returns HealthResponse {
    time:Utc currentTime = time:utcNow();
    
    return {
        status: "healthy",
        message: "Payslip service is operational",
        timestamp: time:utcToString(currentTime),
        version: serviceVersion
    };
}

// Logging utilities
public function logRequest(string method, string path, string? employeeId = ()) {
    string logMessage = method + " " + path;
    if employeeId is string {
        logMessage = logMessage + " - Employee ID: " + employeeId;
    }
    log:printInfo(logMessage);
}

