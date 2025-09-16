import ballerina/http;
import ballerina/mime;
import ballerina/log;
import ballerina/io;
<<<<<<< HEAD
import ballerina/file;

map<Payslip> uploadedPayslips = {};

=======
import ballerinax/mysql;
import ballerina/sql;
import ballerinax/mysql.driver as _; // bundle driver


mysql:Client db = check new(
    host = databaseConfig.DB_HOST,
    port = databaseConfig.DB_PORT,
    user = databaseConfig.DB_USER,
    password = databaseConfig.DB_PASSWORD,
    database = databaseConfig.DB_NAME
);

// Initialize DB - create table if not exists
public function initDB() returns error? {
    // Create table if not exists in the selected DB
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

// No-op; kept for compatibility in case of future multi-database usage
isolated function ensureDatabaseSelected() returns error? {
    return ();
}

map<Payslip> uploadedPayslips = {};




>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
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

<<<<<<< HEAD
=======
    // run DB init on service start
    public function init() returns error? {
        check initDB();
    }

>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
    // Health check endpoint (always public)
    resource function get health() returns HealthResponse {
        logRequest("GET", "/health");
        return createHealthResponse();
    }

<<<<<<< HEAD
    // POST endpoint to upload CSV
    resource function post upload(http:Request req) returns json|error {
        mime:Entity|error fileEntity = req.getEntity();
        if fileEntity is error {
            return {"error": "No file uploaded"};
=======
    
// POST endpoint to upload CSV and save to MySQL DB
    resource function post upload(http:Request req) returns json|error {
    // Ensure DB selected (no-op in current setup)
    check ensureDatabaseSelected();
        mime:Entity|error fileEntity = req.getEntity();
        if fileEntity is error {
            return <json>{ "error": "No file uploaded" };
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
        }

        // Save uploaded CSV temporarily
        string tempCsvPath = "./uploaded.csv";
        byte[] fileContent = check fileEntity.getByteArray();
        check io:fileWriteBytes(tempCsvPath, fileContent);

        // Read CSV as a stream
        stream<string[], io:Error?> csvStream = check io:fileReadCsvAsStream(tempCsvPath);

<<<<<<< HEAD
        Payslip[] newPayslips = [];
=======
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
        int processed = 0;
        int skipped = 0;
        int errors = 0;

<<<<<<< HEAD
        // Iterate CSV rows and populate payslipStore
        check csvStream.forEach(function(string[] row) {
            // Skip completely empty or 1-field rows that are blank (e.g., trailing newline)
=======
    // We'll use REPLACE INTO to upsert by primary key (employeeId)

        // Iterate CSV rows and insert into DB
    check csvStream.forEach(function(string[] row) {
            // Skip empty or invalid rows
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
            if row.length() == 0 {
                skipped += 1;
                return;
            }
<<<<<<< HEAD
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
=======
            if row.length() == 1 && row[0].trim() == "" {
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
                skipped += 1;
                return;
            }

<<<<<<< HEAD
            // Validate minimum columns (0..8 => 9 columns required)
=======
            // Skip header row (case-insensitive)
            string firstCol = row[0].toLowerAscii().trim();
            if firstCol == "employeeid" || firstCol == "employee_id" {
                skipped += 1;
                return;
            }

            // Validate minimum columns
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
            if row.length() < 9 {
                errors += 1;
                log:printWarn("Skipping row due to insufficient columns (" + row.length().toString() + ")");
                return;
            }

<<<<<<< HEAD
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
=======
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
                // Ensure DB selected (no-op in current setup)
                check ensureDatabaseSelected();

                // Create the parameterized upsert query
                sql:ParameterizedQuery pq = `REPLACE INTO payslips
                    (employeeId, designation, name, department, payPeriod, basicSalary, allowances, deductions, netSalary)
                    VALUES (${row[0].trim()}, ${row[1].trim()}, ${row[2].trim()}, ${row[3].trim()}, ${row[4].trim()},
                            ${basicSalary}, ${allowances}, ${deductions}, ${netSalary})`;

                // Execute
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
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
    }


    // Get payslips from uploaded CSV as a map keyed by employeeId
    resource function get all() returns json|error {
<<<<<<< HEAD
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
=======
    check ensureDatabaseSelected();
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
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
        };
    }

    // GET a single payslip by EmployeeId
    resource function get [string employeeId](http:Caller caller, http:Request req) returns error? {
        logRequest("GET", "/payslips/" + employeeId, employeeId);

<<<<<<< HEAD
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
=======
    check ensureDatabaseSelected();

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
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
            check caller->respond({
                status: "error",
                message: "Payslip not found",
                errorCode: "RESOURCE_NOT_FOUND",
                details: "No payslip found for employeeId: " + employeeId
            });
<<<<<<< HEAD
=======
        } else {
            // Unexpected DB error
            check caller->respond({
                status: "error",
                message: "Failed to query database",
                errorCode: "DB_ERROR",
                details: row.toString()
            });
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
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