// ==============================
// Payslip microapp Backend Service
// ==============================
// Handles payslip management including:
// - JWT-protected resource endpoints
// - CSV upload for bulk payslip insertion
// - Fetching single or all payslips
// - Admin-specific endpoints
// - Health check endpoints
// - CORS configuration and error interception
// ==============================

import ballerina/http;
import ballerina/mime;
import ballerina/log;
import ballerina/io;
import ballerina/lang.runtime as runtime;

// Interceptor for logging and custom error handling
service class ErrorInterceptor {
    *http:ResponseErrorInterceptor;

    remote function interceptResponseError(error err, http:RequestContext ctx) returns http:BadRequest|error {
        if err is http:PayloadBindingError {
            string customError = "Payload binding failed!";
            log:printError(customError, err);
            return {
                body: {
                    message: customError
                }
            };
        }
        return err;
    }
}

// CORS configuration for frontend access
@http:ServiceConfig {
    cors: {
        allowOrigins: ["*"],
        allowCredentials: false,
        allowHeaders: ["Authorization", "Content-Type", "x-jwt-assertion"],
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    }
}
service http:InterceptableService / on new http:Listener(serverPort) {

    // Attach interceptors for error handling and JWT validation
    public function createInterceptors() returns http:Interceptor[] =>
    [new ErrorInterceptor(), new JwtInterceptor()];

    // Service initialization: setup DB, log startup, register graceful shutdown
    public function init() returns error? {
        check initDB();
        io:println("Initializing the microapp backend service...");
        runtime:onGracefulStop(stopHandler);
    }

    // GET single payslip for authenticated employee
    resource function get payslip(http:Caller caller, http:Request req, http:RequestContext ctx) returns error? {
        string|error empId = ctx.getWithType("emp_id");
        if empId is error {
            check caller->respond({
                status: "error",
                message: "Invalid request: emp_id missing in JWT",
                errorCode: "UNAUTHORIZED"
            });
            return;
        }

        Payslip|error row = fetchLatestPayslip(empId);
        if row is Payslip {
            check caller->respond(row);
        } else {
            return row;
        }
    }

    // GET all payslips (general view)
    resource function get all() returns json|error {
        Payslip[]|error rows = fetchAllPayslips();
        if rows is error {
            return rows;
        }

        return {
            status: "success",
            message: "Fetched payslips from database",
            count: rows.length(),
            data: rows
        };
    }


    // GET all payslips for admin portal
    resource function get admin\-portal/all() returns json|error {
        Payslip[]|error rows = fetchAllPayslips();
        if rows is error {
            return rows;
        }

        return {
            status: "success",
            message: "Fetched payslips from database",
            count: rows.length(),
            data: rows
        };
    }

    // POST CSV upload to insert multiple payslips
    resource function post admin\-portal/upload(http:Request req) returns json|error {
        check ensureDatabaseSelected();

        mime:Entity|error fileEntity = req.getEntity();
        if fileEntity is error {
            return <json>{ "error": "No file uploaded" };
        }

        string tempCsvPath = "/tmp/uploaded.csv";
        byte[] fileContent = check fileEntity.getByteArray();
        check io:fileWriteBytes(tempCsvPath, fileContent);

        stream<string[], io:Error?> csvStream = check io:fileReadCsvAsStream(tempCsvPath);

        int processed = 0;
        int skipped = 0;
        int errors = 0;

        check csvStream.forEach(function(string[] row) {
            if row.length() == 0 || (row.length() == 1 && row[0].trim() == "") {
                skipped += 1;
                return;
            }

            string firstCol = row[0].toLowerAscii().trim();
            if firstCol == "employeeid" || firstCol == "employee_id" {
                skipped += 1;
                return;
            }

            if row.length() < 9 {
                errors += 1;
                log:printWarn("Skipping row due to insufficient columns (" + row.length().toString() + ")");
                return;
            }

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
                check ensureDatabaseSelected();
                check insertPayslip(
                    row[0].trim(), row[1].trim(), row[2].trim(), row[3].trim(), row[4].trim(),
                    basicSalary, allowances, deductions, netSalary
                );
                processed += 1;
            } on fail var e {
                errors += 1;
                log:printError("Error inserting row for employeeId: " + row[0].trim() + " -> " + e.toString());
            }
        });

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

    // Public health check endpoint
    resource function get health() returns HealthResponse {
        logRequest("GET", "/health");
        return createHealthResponse();
    }
    
}
