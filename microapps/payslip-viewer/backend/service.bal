import ballerina/http;
import ballerina/mime;
import ballerina/log;
import ballerina/io;
import ballerinax/mysql;
import ballerina/sql;
import ballerinax/mysql.driver as _; // bundle driver

// Create mysql client (use named args)
final mysql:Client db = check new(
    host = DB_HOST,
    port = DB_PORT,
    user = DB_USER,
    password = DB_PASSWORD,
    database = DB_NAME
);

// Initialize DB - create table if not exists
public function initDB() returns error? {
    // Use a VARCHAR primary key (employeeId) to match your CSV keys
    _ = check db->execute(`
        CREATE TABLE IF NOT EXISTS payslips (
            employeeId   VARCHAR(64) PRIMARY KEY,
            designation  VARCHAR(255) NOT NULL,
            name         VARCHAR(255) NOT NULL,
            department   VARCHAR(255) NOT NULL,
            payPeriod    VARCHAR(64) NOT NULL,
            basicSalary  DECIMAL(18,2) NOT NULL,
            allowances   DECIMAL(18,2) NOT NULL,
            deductions   DECIMAL(18,2) NOT NULL,
            netSalary    DECIMAL(18,2) NOT NULL
        )
    `);
    return ();
}

map<Payslip> uploadedPayslips = {};




// CORS configuration for frontend access
@http:ServiceConfig {
    cors: {
        allowOrigins: ["*"],
        allowCredentials: false,
        allowHeaders: ["Authorization", "Content-Type"],
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    }
}
// Main payslip service
service /api/v1/payslips on new http:Listener(serverPort) {

    // run DB init on service start
    public function init() returns error? {
        check initDB();
    }

    // Health check endpoint (always public)
    resource function get health() returns HealthResponse {
        logRequest("GET", "/health");
        return createHealthResponse();
    }

    
// POST endpoint to upload CSV and save to MySQL DB
    resource function post upload(http:Request req) returns json|error {
        mime:Entity|error fileEntity = req.getEntity();
        if fileEntity is error {
            return <json>{ "error": "No file uploaded" };
        }

        // Save uploaded CSV temporarily
        string tempCsvPath = "./uploaded.csv";
        byte[] fileContent = check fileEntity.getByteArray();
        check io:fileWriteBytes(tempCsvPath, fileContent);

        // Read CSV as a stream
        stream<string[], io:Error?> csvStream = check io:fileReadCsvAsStream(tempCsvPath);

        int processed = 0;
        int skipped = 0;
        int errors = 0;

    // We'll use REPLACE INTO to upsert by primary key (employeeId)

        // Iterate CSV rows and insert into DB
        check csvStream.forEach(function(string[] row) {
            // Skip empty or invalid rows
            if row.length() == 0 {
                skipped += 1;
                return;
            }
            if row.length() == 1 && row[0].trim() == "" {
                skipped += 1;
                return;
            }

            // Skip header row (case-insensitive)
            string firstCol = row[0].toLowerAscii().trim();
            if firstCol == "employeeid" || firstCol == "employee_id" {
                skipped += 1;
                return;
            }

            // Validate minimum columns
            if row.length() < 9 {
                errors += 1;
                log:printWarn("Skipping row due to insufficient columns (" + row.length().toString() + ")");
                return;
            }

            // Parse numeric values safely (use decimal for money)
            decimal|error basicSalary = decimal:fromString(row[5].trim());
            decimal|error allowances = decimal:fromString(row[6].trim());
            decimal|error deductions = decimal:fromString(row[7].trim());
            decimal|error netSalary = decimal:fromString(row[8].trim());

            if basicSalary is error || allowances is error || deductions is error || netSalary is error {
                errors += 1;
                log:printWarn("Skipping row due to numeric parse error for employeeId: " + row[0].trim());
                return;
            }

            do {
// Create the parameterized query
sql:ParameterizedQuery pq = `REPLACE INTO payslips
    (employeeId, designation, name, department, payPeriod, basicSalary, allowances, deductions, netSalary)
    VALUES (${row[0].trim()}, ${row[1].trim()}, ${row[2].trim()}, ${row[3].trim()}, ${row[4].trim()},
            ${basicSalary}, ${allowances}, ${deductions}, ${netSalary})`;

// Then execute
_ = check db->execute(pq);


                // (optional) you can inspect affectedRowCount if needed:
                // int? affected = result.affectedRowCount;

                processed += 1;
            } on fail var e {
                errors += 1;
                log:printError("Error inserting row for employeeId: " + row[0].trim() + " -> " + e.toString());
            }
        });

        // close csvStream if not already closed
        check csvStream.close();

        log:printInfo("CSV upload summary -> processed: " + processed.toString() +
            ", skipped: " + skipped.toString() + ", errors: " + errors.toString());

        return {
            status: "success",
            message: "CSV uploaded and stored in DB successfully",
            processed: processed,
            skipped: skipped,
            errors: errors
        };
    }


    // Get payslips from uploaded CSV as a map keyed by employeeId
    resource function get all() returns json|error {
        // Prefer DB, but handle empty table gracefully
        sql:ParameterizedQuery q = `SELECT 
                employeeId,
                designation,
                name,
                department,
                payPeriod,
                CAST(basicSalary AS DOUBLE) AS basicSalary,
                CAST(allowances AS DOUBLE) AS allowances,
                CAST(deductions AS DOUBLE) AS deductions,
                CAST(netSalary AS DOUBLE) AS netSalary
            FROM payslips`;

    stream<Payslip, error?> resultStream = db->query(q);
        Payslip[] rows = [];
        check resultStream.forEach(function(Payslip p) {
            rows.push(p);
        });
        check resultStream.close();

        return {
            status: "success",
            message: "Fetched payslips from database",
            count: rows.length(),
            data: rows
        };
    }

    // GET a single payslip by EmployeeId
    resource function get [string employeeId](http:Caller caller, http:Request req) returns error? {
        logRequest("GET", "/payslips/" + employeeId, employeeId);

        // Query DB for the payslip
        sql:ParameterizedQuery q = `SELECT 
                employeeId,
                designation,
                name,
                department,
                payPeriod,
                CAST(basicSalary AS DOUBLE) AS basicSalary,
                CAST(allowances AS DOUBLE) AS allowances,
                CAST(deductions AS DOUBLE) AS deductions,
                CAST(netSalary AS DOUBLE) AS netSalary
            FROM payslips WHERE employeeId = ${employeeId} LIMIT 1`;

    Payslip|sql:NoRowsError|error row = db->queryRow(q);

        if row is Payslip {
            check caller->respond({
                status: "success",
                message: "Payslip retrieved successfully",
                data: row
            });
    } else if row is sql:NoRowsError {
            check caller->respond({
                status: "error",
                message: "Payslip not found",
                errorCode: "RESOURCE_NOT_FOUND",
                details: "No payslip found for employeeId: " + employeeId
            });
        } else {
            // Unexpected DB error
            check caller->respond({
                status: "error",
                message: "Failed to query database",
                errorCode: "DB_ERROR",
                details: row.toString()
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