// import ballerinax/mysql;
// import ballerina/sql;
// //import ballerina/log;

// // public type DatabaseConfig record {|
// //     string DB_HOST;
// //     int DB_PORT;
// //     string DB_USER;
// //     string DB_PASSWORD;
// //     string DB_NAME;
// // |};

// // public type Payslip record {| 
// //     string employeeId;
// //     string name;
// //     string designation;
// //     string payPeriod; // Format: YYYY-MM
// //     float basicSalary;
// //     float allowances;
// //     float deductions;
// //     float netSalary;
// //     string? department?; // Optional
// //     string? location?;   // Optional
// // |};

// configurable DatabaseConfig databaseConfig = ?;

// public mysql:Client db = check new (
//     host = databaseConfig.DB_HOST,
//     port = databaseConfig.DB_PORT,
//     user = databaseConfig.DB_USER,
//     password = databaseConfig.DB_PASSWORD,
//     database = databaseConfig.DB_NAME
// );

// // Initialize DB schema
// public function initDB() returns error? {
//     _ = check db->execute(`CREATE TABLE IF NOT EXISTS payslips (
//             employeeId   VARCHAR(64) PRIMARY KEY,
//             name         VARCHAR(255) NOT NULL,
//             designation  VARCHAR(255) NOT NULL,
//             payPeriod    VARCHAR(64) NOT NULL,
//             basicSalary  DECIMAL(18,2) NOT NULL,
//             allowances   DECIMAL(18,2) NOT NULL,
//             deductions   DECIMAL(18,2) NOT NULL,
//             netSalary    DECIMAL(18,2) NOT NULL,
//             department   VARCHAR(255) NULL,
//             location     VARCHAR(255) NULL
//         )`);
// }

// // Get latest payslip by employeeId
// public function getLatestPayslip(string empId) returns Payslip|error {
//     sql:ParameterizedQuery q = `SELECT 
//                 employeeId,
//                 name,
//                 designation,
//                 payPeriod,
//                 CAST(basicSalary AS DOUBLE) AS basicSalary,
//                 CAST(allowances AS DOUBLE) AS allowances,
//                 CAST(deductions AS DOUBLE) AS deductions,
//                 CAST(netSalary AS DOUBLE) AS netSalary,
//                 department,
//                 location
//             FROM payslips 
//             WHERE employeeId = ${empId} 
//             ORDER BY payPeriod DESC 
//             LIMIT 1`;
//     return db->queryRow(q);
// }

// // Insert or replace a payslip record
// public function upsertPayslip(Payslip p) returns error? {
//     sql:ParameterizedQuery query = `INSERT INTO payslips
//             (employeeId, name, designation, payPeriod, basicSalary, allowances, deductions, netSalary, department, location)
//             VALUES (${p.employeeId}, ${p.name}, ${p.designation}, ${p.payPeriod},
//                     ${p.basicSalary}, ${p.allowances}, ${p.deductions}, ${p.netSalary},
//                     ${p.department}, ${p.location})
//             ON DUPLICATE KEY UPDATE
//                 name = VALUES(name),
//                 designation = VALUES(designation),
//                 payPeriod = VALUES(payPeriod),
//                 basicSalary = VALUES(basicSalary),
//                 allowances = VALUES(allowances),
//                 deductions = VALUES(deductions),
//                 netSalary = VALUES(netSalary),
//                 department = VALUES(department),
//                 location = VALUES(location)`;

//     _ = check db->execute(pq);
// }



// // Get all payslips
// public function getAllPayslips() returns Payslip[]|error {
//     sql:ParameterizedQuery q = `SELECT 
//                 employeeId,
//                 name,
//                 designation,
//                 payPeriod,
//                 CAST(basicSalary AS DOUBLE) AS basicSalary,
//                 CAST(allowances AS DOUBLE) AS allowances,
//                 CAST(deductions AS DOUBLE) AS deductions,
//                 CAST(netSalary AS DOUBLE) AS netSalary,
//                 department,
//                 location
//             FROM payslips`;
//     stream<Payslip, error?> resultStream = db->query(q);
//     Payslip[] rows = [];
//     check resultStream.forEach(function(Payslip p) {
//         rows.push(p);
//     });
//     check resultStream.close();
//     return rows;
// }