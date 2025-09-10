import ballerina/log;
import ballerina/time;
import ballerina/regex;
import ballerina/http;

// Validation utilities
public function validateEmployeeId(string employeeId) returns ValidationError? {
    if employeeId.trim().length() == 0 {
        return {fieldName: "employeeId", message: "Employee ID cannot be empty"};
    }
    
    // Basic format validation (adjust regex as needed)
    if !regex:matches(employeeId, "^[A-Z]{3}\\d{3,6}$") {
        return {fieldName: "employeeId", message: "Employee ID must follow format: ABC123 (3 letters + 3-6 digits)"};
    }
    
    return ();
}

public function validatePayPeriod(string payPeriod) returns ValidationError? {
    if !regex:matches(payPeriod, "^\\d{4}-\\d{2}$") {
        return {fieldName: "payPeriod", message: "Pay period must be in format YYYY-MM"};
    }
    return ();
}

// Response utilities
public function createSuccessResponse(Payslip payslip) returns PayslipResponse {
    return {
        status: "success",
        message: "Payslip retrieved successfully",
        data: payslip
    };
}

public function createSuccessListResponse(Payslip[] payslips) returns PayslipsResponse {
    return {
        status: "success",
        message: "Payslips retrieved successfully",
        data: payslips,
        count: payslips.length()
    };
}

public function createErrorResponse(string message, string errorCode, string? details = ()) returns ErrorResponse {
    return {
        status: "error",
        message: message,
        errorCode: errorCode,
        details: details
    };
}

public function createNotFoundResponse(string resourceId) returns ErrorResponse {
    return createErrorResponse(
        "Resource not found: " + resourceId,
        "RESOURCE_NOT_FOUND",
        "No payslip found for employee ID: " + resourceId
    );
}

public function createValidationErrorResponse(ValidationError validationError) returns ErrorResponse {
    return createErrorResponse(
        "Validation failed",
        "VALIDATION_ERROR",
        validationError.fieldName + ": " + validationError.message
    );
}

public function createUnauthorizedResponse() returns ErrorResponse {
    return createErrorResponse(
        "Authentication required",
        "UNAUTHORIZED",
        "Please provide a valid authorization token"
    );
}

public function createForbiddenResponse() returns ErrorResponse {
    return createErrorResponse(
        "Access forbidden",
        "FORBIDDEN", 
        "You don't have permission to access this resource"
    );
}

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

public function extractAuthContext(http:Request request) returns AuthContext|ErrorResponse {
    // If authentication is disabled, return a mock context
    if !authConfig.enabled {
        return {
            userId: "system",
            roles: ["admin"],
            isAuthenticated: true,
            department: () // No department restriction
        };
    }
    
    // Extract Authorization header
    string|http:HeaderNotFoundError authHeader = request.getHeader("Authorization");
    
    if authHeader is http:HeaderNotFoundError {
        return createUnauthorizedResponse();
    }
    
    // Validate Bearer token format
    if !authHeader.startsWith("Bearer ") {
        return createErrorResponse(
            "Invalid authorization header format",
            "INVALID_AUTH_HEADER",
            "Authorization header must be in format: Bearer <token>"
        );
    }
    
    string token = authHeader.substring(7); // Remove "Bearer " prefix
    
    // TODO: Implement actual JWT validation here
    // For now, return a mock context based on token
    AuthContext|ErrorResponse authResult = validateToken(token);
    
    return authResult;
}

// Mock JWT validation - Replace with actual JWT library implementation
function validateToken(string token) returns AuthContext|ErrorResponse {
    // Mock validation - in production, use proper JWT validation
    match token {
        "admin-token" => {
            return {
                userId: "admin",
                roles: ["admin", "hr"],
                token: token,
                isAuthenticated: true,
                department: () // Admin can access all departments
            };
        }
        "emp001-token" => {
            return {
                userId: "EMP001",
                roles: ["employee"],
                token: token,
                isAuthenticated: true,
                department: "Engineering"
            };
        }
        "emp002-token" => {
            return {
                userId: "EMP002", 
                roles: ["employee"],
                token: token,
                isAuthenticated: true,
                department: "Analytics"
            };
        }
        _ => {
            return createErrorResponse(
                "Invalid or expired token",
                "INVALID_TOKEN",
                "The provided token is not valid or has expired"
            );
        }
    }
}

public function hasPermission(AuthContext authContext, string operation, string? resourceId = ()) returns boolean {
    // Admin has access to everything
    if authContext.roles.indexOf("admin") != () {
        return true;
    }
    
    // HR has access to all payslips
    if authContext.roles.indexOf("hr") != () {
        return true;
    }
    
    // Employees can only access their own payslips
    if authContext.roles.indexOf("employee") != () {
        if operation == "read" && resourceId is string {
            return authContext.userId == resourceId;
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

public function logAuthAttempt(string userId, boolean success) {
    string logMessage = "Authentication attempt for user: " + userId + " - " + (success ? "SUCCESS" : "FAILED");
    if success {
        log:printInfo(logMessage);
    } else {
        log:printWarn(logMessage);
    }
}
