import ballerina/io;
import ballerina/sql;
import ballerinax/mysql.driver as _; // bundle driver
//import ballerinax/mysql;
//import db_client;

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

public isolated function ensureDatabaseSelected() returns error? {
    return ();
}

public isolated function insertPayslip(
        string employeeId, string designation, string name, string department, string payPeriod,
        decimal basicSalary, decimal allowances, decimal deductions, decimal netSalary
    ) returns error? {

    sql:ParameterizedQuery pq = `REPLACE INTO payslips
        (employeeId, designation, name, department, payPeriod, basicSalary, allowances, deductions, netSalary)
        VALUES (${employeeId}, ${designation}, ${name}, ${department}, ${payPeriod},
                ${basicSalary}, ${allowances}, ${deductions}, ${netSalary})`;

    _ = check databaseClient->execute(pq);
}

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
            FROM payslips 
            WHERE employeeId = ${employeeId} 
            ORDER BY payPeriod DESC 
            LIMIT 1`;

    return databaseClient->queryRow(q);
}

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
            FROM payslips`;

    stream<Payslip, error?> resultStream = databaseClient->query(q);
    Payslip[] rows = [];
    check resultStream.forEach(function(Payslip p) {
        rows.push(p);
    });
    check resultStream.close();

    return rows;
}

public function stopHandler() returns error? {
    io:println("Performing shutdown tasks...");
    check databaseClient.close();
    io:println("Database client closed gracefully.");
    return ();
}
