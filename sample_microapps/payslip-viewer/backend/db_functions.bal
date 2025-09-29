// ==============================
// DB Functions Module
// ==============================
// Provides helper functions for interacting with the Payslip database:
// - initDB: Creates the payslip table if it doesn't exist
// - insertPayslip: Inserts or updates a payslip record
// - fetchLatestPayslip: Retrieves the latest payslip for an employee
// - fetchAllPayslips: Retrieves all payslip records
// - stopHandler: Gracefully closes the database client
// ==============================

import ballerina/io;
import ballerina/sql;
import ballerinax/mysql.driver as _; // bundle driver

// Initializes the payslip table if it doesn't already exist
public function initDB() returns error? {
    _ = check databaseClient->execute(`
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
}

// Placeholder for DB selection logic (kept for compatibility)
public isolated function ensureDatabaseSelected() returns error? {
    return ();
}


// Insert or replace a payslip record for an employee
public isolated function insertPayslip(
        string employeeId, string designation, string name, string department, string payPeriod,
        decimal basicSalary, decimal allowances, decimal deductions, decimal netSalary
    ) returns error? {

    sql:ParameterizedQuery pq = `REPLACE INTO ${PAYSLIP_TABLE}
        (employeeId, designation, name, department, payPeriod, basicSalary, allowances, deductions, netSalary)
        VALUES (${employeeId}, ${designation}, ${name}, ${department}, ${payPeriod},
                ${basicSalary}, ${allowances}, ${deductions}, ${netSalary})`;

    _ = check databaseClient->execute(pq);
}

// Fetch the most recent payslip for a given employee
public function fetchLatestPayslip(string employeeId) returns Payslip|error {
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
            FROM ${PAYSLIP_TABLE} 
            WHERE employeeId = ${employeeId} 
            ORDER BY payPeriod DESC 
            LIMIT 1`;

    return databaseClient->queryRow(q);
}

// Fetch all payslip records in the table
public function fetchAllPayslips() returns Payslip[]|error {
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
            FROM ${PAYSLIP_TABLE}`;

    stream<Payslip, error?> resultStream = databaseClient->query(q);
    Payslip[] rows = [];
    check resultStream.forEach(function(Payslip p) {
        rows.push(p);
    });
    check resultStream.close();

    return rows;
}

// Gracefully closes the DB client during shutdown
public function stopHandler() returns error? {
    io:println("Performing shutdown tasks...");
    check databaseClient.close();
    io:println("Database client closed gracefully.");
    return ();
}
