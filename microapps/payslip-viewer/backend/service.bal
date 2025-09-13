import ballerina/http;
import ballerina/mime;
import ballerina/log;
import ballerina/io;
import ballerina/file;

map<Payslip> uploadedPayslips = {};

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
        int processed = 0;
        int skipped = 0;
        int errors = 0;

        // Iterate CSV rows and populate payslipStore
        check csvStream.forEach(function(string[] row) {
            // Skip completely empty or 1-field rows that are blank (e.g., trailing newline)
            if row.length() == 0 {
                skipped += 1;
                return;
            }
            if row.length() == 1 {
                string first = row[0].trim();
                if first == "" {
                    skipped += 1;
                    return;
                }
            }

            // Skip header row if present
            string firstCol = row[0].toLowerAscii().trim();
            if firstCol == "employeeid" {
                skipped += 1;
                return;
            }

            // Validate minimum columns (0..8 => 9 columns required)
            if row.length() < 9 {
                errors += 1;
                log:printWarn("Skipping row due to insufficient columns (" + row.length().toString() + ")");
                return;
            }

            // Convert numeric strings to float safely
            float|error basicSalary = 'float:fromString(row[5].trim());
            float|error allowances = 'float:fromString(row[6].trim());
            float|error deductions = 'float:fromString(row[7].trim());
            float|error netSalary = 'float:fromString(row[8].trim());

            do {
                newPayslips.push({
                    employeeId: row[0].trim(),
                    designation: row[1].trim(),
                    name: row[2].trim(),
                    department: row[3].trim(),
                    payPeriod: row[4].trim(),
                    basicSalary: check basicSalary,
                    allowances: check allowances,
                    deductions: check deductions,
                    netSalary: check netSalary
                });
                processed += 1;
            } on fail var e {
                errors += 1;
                log:printError("Error processing row: " + e.toString());
            }
        });

        // Replace global store
        //payslipStore = newPayslips;

    log:printInfo("CSV upload summary -> processed: " + processed.toString() + ", skipped: " + skipped.toString() + ", errors: " + errors.toString());
    return { message: "CSV uploaded successfully", count: newPayslips.length(), processed, skipped, errors };
    }


    // Get payslips from uploaded CSV as a map keyed by employeeId
    resource function get all() returns json|error {
        string csvPath = "./uploaded.csv";

        // Check if file exists
        // Check if file exists using ballerina/file
        boolean exists = check file:test(csvPath, file:EXISTS);
        if !exists {
            return { message: "No uploaded CSV found", payslips: {} };
        }

        // Read CSV as a stream
        stream<string[], io:Error?> csvStream = check io:fileReadCsvAsStream(csvPath);

        Payslip[] payslips = [];

        check csvStream.forEach(function(string[] row) {
            // Skip empty or invalid rows
            if row.length() < 9 || row[0].toLowerAscii().trim() == "employeeid" {
                return;
            }

            float|error basicSalary = float:fromString(row[5].trim());
            float|error allowances = float:fromString(row[6].trim());
            float|error deductions = float:fromString(row[7].trim());
            float|error netSalary = float:fromString(row[8].trim());

            // Skip row if numeric parsing fails
            if basicSalary is error || allowances is error || deductions is error || netSalary is error {
                return;
            }

            payslips.push({
                employeeId: row[0].trim(),
                designation: row[1].trim(),
                name: row[2].trim(),
                department: row[3].trim(),
                payPeriod: row[4].trim(),
                basicSalary: basicSalary,
                allowances: allowances,
                deductions: deductions,
                netSalary: netSalary
            });
        });

        return {
            status: "success",
            message: "Fetched payslips from CSV",
            count: payslips.length(),
            data: payslips
        };
    }

    // GET a single payslip by EmployeeId
    resource function get [string employeeId](http:Caller caller, http:Request req) returns error? {
        logRequest("GET", "/payslips/" + employeeId, employeeId);

        string csvFilePath = "./uploaded.csv";
        boolean exists = check file:test(csvFilePath, file:EXISTS);
        if !exists {
            check caller->respond({
                status: "error",
                message: "CSV file not found",
                errorCode: "FILE_NOT_FOUND"
            });
            return ();
        }

        Payslip? foundPayslip = ();

        stream<string[], io:Error?> csvStream = check io:fileReadCsvAsStream(csvFilePath);
        check csvStream.forEach(function(string[] row) {
            if row.length() < 9 || row[0].toLowerAscii().trim() == "employeeid" {
                return;
            }

            if row[0].trim() != employeeId {
                return;
            }

            float|error basicSalary = float:fromString(row[5].trim());
            float|error allowances = float:fromString(row[6].trim());
            float|error deductions = float:fromString(row[7].trim());
            float|error netSalary = float:fromString(row[8].trim());

            if basicSalary is error || allowances is error || deductions is error || netSalary is error {
                return;
            }

            foundPayslip = {
                employeeId: row[0].trim(),
                designation: row[1].trim(),
                name: row[2].trim(),
                department: row[3].trim(),
                payPeriod: row[4].trim(),
                basicSalary: basicSalary,
                allowances: allowances,
                deductions: deductions,
                netSalary: netSalary
            };
        });

        if foundPayslip is Payslip {
            check caller->respond({
                status: "success",
                message: "Payslip retrieved successfully",
                data: foundPayslip
            });
        } else {
            check caller->respond({
                status: "error",
                message: "Payslip not found",
                errorCode: "RESOURCE_NOT_FOUND",
                details: "No payslip found for employeeId: " + employeeId
            });
        }

        return ();
    }

}





/////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Mock data functions (replace with database integration)
// function getMockPayslips() returns Payslip[] {
//     return [
//         {
//             employeeId: "EMP001",
//             designation: "Software Engineer",
//             name: "John Doe",
//             department: "Engineering",
//             payPeriod: "2024-01",
//             basicSalary: 75000.00,
//             allowances: 15000.00,
//             deductions: 8000.00,
//             netSalary: 87000.00
//         },
//         {
//             employeeId: "EMP002",
//             designation: "Data Analyst",
//             name: "Jane Smith",
//             department: "Analytics", 
//             payPeriod: "2024-01",
//             basicSalary: 80000.00,
//             allowances: 12000.00,
//             deductions: 9500.00,
//             netSalary: 85500.00
//         },
//         {
//             employeeId: "EMP003",
//             designation: "Software Engineer",
//             name: "Mike Johnson",
//             department: "Engineering",
//             payPeriod: "2024-01",
//             basicSalary: 70000.00,
//             allowances: 10000.00,
//             deductions: 7200.00,
//             netSalary: 74800.00
//         }
//     ];
// }

// function getMockPayslip(string employeeId, string? payPeriod = ()) returns Payslip? {
//     Payslip[] allPayslips = getMockPayslips();
    
//     foreach Payslip slip in allPayslips {
//         if slip.employeeId == employeeId {
//             if payPeriod is string {
//                 if slip.payPeriod == payPeriod {
//                     return slip;
//                 }
//             } else {
//                 return slip; // Return first found if no period specified
//             }
//         }
//     }
    
//     return ();
// }

// // Service initialization
// public function main() returns error? {
//     string separator = "=================================================";
//     log:printInfo(separator);
//     log:printInfo("🚀 Starting Payslip Service");
//     log:printInfo("Environment: " + environment);
//     log:printInfo("Version: " + serviceVersion);
//     log:printInfo("Port: " + serverPort.toString());
//     log:printInfo("Authentication: " + (authConfig.enabled ? "ENABLED" : "DISABLED"));
//     if authConfig.enabled {
//         log:printInfo("Public Endpoints: " + authConfig.publicEndpoints.toString());
//     }
//     log:printInfo("Sample Data: " + getMockPayslips().length().toString() + " payslips loaded");
//     log:printInfo(separator);
//     log:printInfo("✅ Payslip service started successfully!");
//     log:printInfo(separator);
// }

    // // Get all payslips (with authentication and authorization)
    // resource function get .(http:Request request) returns PayslipsResponse|ErrorResponse {
    //     logRequest("GET", "/payslips");
        
    //     // Authentication check (if enabled)
    //     if authConfig.enabled && !isPublicEndpoint("/api/v1/payslips") {
    //         AuthContext|ErrorResponse authResult = extractAuthContext(request);
            
    //         if authResult is ErrorResponse {
    //             return authResult;
    //         }
            
    //         AuthContext authContext = <AuthContext>authResult;
    //         logAuthAttempt(authContext.userId, true);
            
    //         // Check permissions
    //         if !hasPermission(authContext, "read") {
    //             return createForbiddenResponse();
    //         }
            
    //         // Get payslips and filter based on authorization
    //         Payslip[] filteredPayslips = getMockPayslips();
    //         log:printInfo("Retrieved " + filteredPayslips.length().toString() + " payslips for user: " + authContext.userId);
            
    //         return createSuccessListResponse(filteredPayslips);
    //     }
        
    //     // If authentication is disabled, return all payslips
    //     Payslip[] allPayslips = getMockPayslips();
    //     log:printInfo("Retrieved " + allPayslips.length().toString() + " payslips (authentication disabled)");
    //     return createSuccessListResponse(allPayslips);
    // }

    // // Get payslip by employee ID (with authentication and authorization)
    // resource function get [string employeeId](http:Request request, string? payPeriod = ()) returns PayslipResponse|ErrorResponse {
    //     logRequest("GET", "/payslips/" + employeeId, employeeId);
        
    //     // Validate employee ID format
    //     ValidationError? validationError = validateEmployeeId(employeeId);
    //     if validationError is ValidationError {
    //         return createValidationErrorResponse(validationError);
    //     }
        
    //     // Validate pay period if provided
    //     if payPeriod is string {
    //         ValidationError? periodError = validatePayPeriod(payPeriod);
    //         if periodError is ValidationError {
    //             return createValidationErrorResponse(periodError);
    //         }
    //     }
        
    //     // Authentication check (if enabled)
    //     if authConfig.enabled && !isPublicEndpoint("/api/v1/payslips/" + employeeId) {
    //         AuthContext|ErrorResponse authResult = extractAuthContext(request);
            
    //         if authResult is ErrorResponse {
    //             return authResult;
    //         }
            
    //         AuthContext authContext = <AuthContext>authResult;
    //         logAuthAttempt(authContext.userId, true);
            
    //         // Check permissions for specific resource
    //         if !hasPermission(authContext, "read", employeeId) {
    //             return createForbiddenResponse();
    //         }
    //     }
        
    //     // Get payslip data
    //     // = getMockPayslip(employeeId, payPeriod);
    //     Payslip? payslip = getEmployeePayslip(uploadedPayslips, employeeId);
        
    //     if payslip is () {
    //         log:printWarn("Payslip not found for employee: " + employeeId);
    //         return createNotFoundResponse(employeeId);
    //     }
        
    //     log:printInfo("Payslip retrieved successfully for employee: " + employeeId);
    //     return createSuccessResponse(payslip);
    // }

    // In-memory payslip store (replace with persistent storage for production)
//Payslip[] payslipStore = getMockPayslips();