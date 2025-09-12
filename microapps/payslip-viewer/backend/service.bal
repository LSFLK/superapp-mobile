import ballerina/http;
import ballerina/mime;
import ballerina/log;
import ballerina/io;

// In-memory payslip store (replace with persistent storage for production)
Payslip[] payslipStore = getMockPayslips();

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

    // POST endpoint to upload CSV
    resource function post upload(http:Request req) returns json|error {
        mime:Entity|error fileEntity = req.getEntity();
        if fileEntity is error {
            return {"error": "No file uploaded"};
        }

        // Save uploaded CSV temporarily
        string tempCsvPath = "./uploaded.csv";
        byte[] fileContent = check fileEntity.getByteArray();
        check io:fileWriteBytes(tempCsvPath, fileContent);

        // Read CSV as a stream
        stream<string[], io:Error?> csvStream = check io:fileReadCsvAsStream(tempCsvPath);

        Payslip[] newPayslips = [];

        // Iterate CSV rows and populate payslipStore
        check csvStream.forEach(function(string[] row) {
            // Skip header row if it exists
            if row[0] == "employeeId" {
                return;
            }

            // Convert numeric strings to float
            float|error basicSalary = 'float:fromString(row[5]);
            float|error allowances = 'float:fromString(row[6]);
            float|error deductions = 'float:fromString(row[7]);
            float|error netSalary = 'float:fromString(row[8]);

            do {
	
	            newPayslips.push({
	                employeeId: row[0],
	                designation: row[1],
	                name: row[2],
	                department: row[3],
	                payPeriod: row[4],
	                basicSalary: check basicSalary,
	                allowances: check allowances,
	                deductions: check deductions,
	                netSalary: check netSalary
	            });
            } on fail var e {
                log:printError("Error processing row: " + e.toString());
            }
        });

        // Replace global store
        payslipStore = newPayslips;

        return { message: "CSV uploaded successfully", count: payslipStore.length() };
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

