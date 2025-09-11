import ballerina/http;
import ballerina/log;

// CORS configuration for frontend access
@http:ServiceConfig {
    cors: {
        allowOrigins: ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
        allowCredentials: false,
        allowHeaders: ["Authorization", "Content-Type"],
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    }
}
// Main payslip service
service /api/v1/payslips on new http:Listener(serverPort) {

    // Health check endpoint (always public)
    resource function get health() returns HealthResponse {
        logRequest("GET", "/health");
        return createHealthResponse();
    }

    // Get all payslips (with authentication and authorization)
    resource function get .(http:Request request) returns PayslipsResponse|ErrorResponse {
        logRequest("GET", "/payslips");
        
        // Authentication check (if enabled)
        if authConfig.enabled && !isPublicEndpoint("/api/v1/payslips") {
            AuthContext|ErrorResponse authResult = extractAuthContext(request);
            
            if authResult is ErrorResponse {
                return authResult;
            }
            
            AuthContext authContext = <AuthContext>authResult;
            logAuthAttempt(authContext.userId, true);
            
            // Check permissions
            if !hasPermission(authContext, "read") {
                return createForbiddenResponse();
            }
            
            // Get payslips and filter based on authorization
            Payslip[] filteredPayslips = getMockPayslips();
            log:printInfo("Retrieved " + filteredPayslips.length().toString() + " payslips for user: " + authContext.userId);
            
            return createSuccessListResponse(filteredPayslips);
        }
        
        // If authentication is disabled, return all payslips
        Payslip[] allPayslips = getMockPayslips();
        log:printInfo("Retrieved " + allPayslips.length().toString() + " payslips (authentication disabled)");
        return createSuccessListResponse(allPayslips);
    }

    // Get payslip by employee ID (with authentication and authorization)
    resource function get [string employeeId](http:Request request, string? payPeriod = ()) returns PayslipResponse|ErrorResponse {
        logRequest("GET", "/payslips/" + employeeId, employeeId);
        
        // Validate employee ID format
        ValidationError? validationError = validateEmployeeId(employeeId);
        if validationError is ValidationError {
            return createValidationErrorResponse(validationError);
        }
        
        // Validate pay period if provided
        if payPeriod is string {
            ValidationError? periodError = validatePayPeriod(payPeriod);
            if periodError is ValidationError {
                return createValidationErrorResponse(periodError);
            }
        }
        
        // Authentication check (if enabled)
        if authConfig.enabled && !isPublicEndpoint("/api/v1/payslips/" + employeeId) {
            AuthContext|ErrorResponse authResult = extractAuthContext(request);
            
            if authResult is ErrorResponse {
                return authResult;
            }
            
            AuthContext authContext = <AuthContext>authResult;
            logAuthAttempt(authContext.userId, true);
            
            // Check permissions for specific resource
            if !hasPermission(authContext, "read", employeeId) {
                return createForbiddenResponse();
            }
        }
        
        // Get payslip data
        Payslip? payslip = getMockPayslip(employeeId, payPeriod);
        
        if payslip is () {
            log:printWarn("Payslip not found for employee: " + employeeId);
            return createNotFoundResponse(employeeId);
        }
        
        log:printInfo("Payslip retrieved successfully for employee: " + employeeId);
        return createSuccessResponse(payslip);
    }
}

// Mock data functions (replace with database integration)
function getMockPayslips() returns Payslip[] {
    return [
        {
            employeeId: "EMP001",
            designation: "Software Engineer",
            name: "John Doe",
            department: "Engineering",
            payPeriod: "2024-01",
            basicSalary: 75000.00,
            allowances: 15000.00,
            deductions: 8000.00,
            netSalary: 87000.00
        },
        {
            employeeId: "EMP002",
            designation: "Data Analyst",
            name: "Jane Smith",
            department: "Analytics", 
            payPeriod: "2024-01",
            basicSalary: 80000.00,
            allowances: 12000.00,
            deductions: 9500.00,
            netSalary: 85500.00
        },
        {
            employeeId: "EMP003",
            designation: "Software Engineer",
            name: "Mike Johnson",
            department: "Engineering",
            payPeriod: "2024-01",
            basicSalary: 70000.00,
            allowances: 10000.00,
            deductions: 7200.00,
            netSalary: 74800.00
        }
    ];
}

function getMockPayslip(string employeeId, string? payPeriod = ()) returns Payslip? {
    Payslip[] allPayslips = getMockPayslips();
    
    foreach Payslip slip in allPayslips {
        if slip.employeeId == employeeId {
            if payPeriod is string {
                if slip.payPeriod == payPeriod {
                    return slip;
                }
            } else {
                return slip; // Return first found if no period specified
            }
        }
    }
    
    return ();
}

// Service initialization
public function main() returns error? {
    string separator = "=================================================";
    log:printInfo(separator);
    log:printInfo("🚀 Starting Payslip Service");
    log:printInfo("Environment: " + environment);
    log:printInfo("Version: " + serviceVersion);
    log:printInfo("Port: " + serverPort.toString());
    log:printInfo("Authentication: " + (authConfig.enabled ? "ENABLED" : "DISABLED"));
    if authConfig.enabled {
        log:printInfo("Public Endpoints: " + authConfig.publicEndpoints.toString());
    }
    log:printInfo("Sample Data: " + getMockPayslips().length().toString() + " payslips loaded");
    log:printInfo(separator);
    log:printInfo("✅ Payslip service started successfully!");
    log:printInfo(separator);
}

