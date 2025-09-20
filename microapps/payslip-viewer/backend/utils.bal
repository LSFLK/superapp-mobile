import ballerina/log;
import ballerina/time;


// Health check utilities
public function createHealthResponse() returns HealthResponse {
    time:Utc currentTime = time:utcNow();
    
    return {
        status: "healthy",
        message: "Payslip service is operational",
        timestamp: time:utcToString(currentTime),
        version: serviceVersion,
        environment: environment
    };
}

// Authentication utilities
public function isPublicEndpoint(string path) returns boolean {
    foreach string endpoint in authConfig.publicEndpoints {
        if path == endpoint {
            return true;
        }
    }
    return false;
}

// Logging utilities
public function logRequest(string method, string path, string? employeeId = ()) {
    string logMessage = method + " " + path;
    if employeeId is string {
        logMessage = logMessage + " - Employee ID: " + employeeId;
    }
    log:printInfo(logMessage);
}

