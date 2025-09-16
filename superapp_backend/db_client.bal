import ballerinax/mysql;
import ballerinax/mysql.driver as _;
import ballerina/log;
import ballerina/sql;
import ballerina/io;

/////////////////////////////////////////////////////////////
//Types

// Record representing a row in the `users` table
type User record {
    int user_id;
    string first_name;
    string last_name;
    string email;
    string employee_id;
    string department;
};

type SuperappMobileDatabaseConfig record {|
    *DatabaseConfig;
    mysql:Options? options;
|};

// Record for micro_app (optional)
type MicroApp record {
    int micro_app_id;
    string app_id;
    string name;
    string version;
    int? zip_blob_length;   // size in bytes
    string? created_at;     // timestamp as string
};

/////////////////////////////////////////////////////////
// Databse Connection Configuration

configurable DatabaseConfig databaseConfig = ?;

SuperappMobileDatabaseConfig superappMobileDatabaseConfig = {
    ...databaseConfig,
    options: {
        ssl: { mode: mysql:SSL_PREFERRED },
        connectTimeout: 10
    }
};

final mysql:Client databaseClient = check new (...superappMobileDatabaseConfig);


///////////////////////////////////////////////////////////////////
// Functions to interact with the database

// Function to insert a micro-app with a ZIP file
public function insertMicroAppWithZip(string name, string version, string zipFilePath, string appId) returns error? {

    // Read ZIP file from local path
    byte[] zipData = check io:fileReadBytes(zipFilePath);

    // Parameterized query to insert into micro_apps
    //sql:ParameterizedQuery query = `INSERT INTO micro_apps (name, version, zip_blob, app_id) VALUES (${name}, ${version}, ${zipData}, ${appId});`;
    sql:ParameterizedQuery query = `
    INSERT INTO micro_apps (name, version, zip_blob, app_id)
    VALUES (${name}, ${version}, ${zipData}, ${appId})
    ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        version = VALUES(version),
        zip_blob = VALUES(zip_blob),
        created_at = CURRENT_TIMESTAMP;
    `;

    // Execute the query
    sql:ExecutionResult result = check databaseClient->execute(query);

    io:println("Rows affected: " + result.affectedRowCount.toString());
}

// Function to fetch all micro-apps from the database
public function fetchAllMicroApps() returns error? {
    sql:ParameterizedQuery query = `
        SELECT micro_app_id, app_id, name, version, LENGTH(zip_blob) AS zip_blob_length, created_at
        FROM micro_apps;
    `;

    stream<MicroApp, sql:Error?> resultStream = databaseClient->query(query);

    check from MicroApp app in resultStream
        do {
            log:printInfo(
                "MicroApp: " + app.name + 
                " | App ID: " + app.app_id +
                " | Version: " + app.version +
                " | ZIP size: " + app.zip_blob_length.toString() +
                " | Created at: " + app.created_at.toString()
            );
        };
}

// Function to fetch a micro-app by its ID
public function fetchMicroAppById(string app_id) returns MicroApp|error {
    sql:ParameterizedQuery query = `
        SELECT micro_app_id, app_id, name, version, LENGTH(zip_blob) AS zip_blob_length, created_at
        FROM micro_apps
        WHERE app_id = ${app_id};
    `;

    stream<MicroApp, sql:Error?> resultStream = databaseClient->query(query);

    MicroApp? foundApp = check from MicroApp app in resultStream
                         do {
                             return app; // return first match
                         };

    if foundApp is MicroApp {
        log:printInfo(
            "Found MicroApp: " + foundApp.name +
            " | App ID: " + foundApp.app_id +
            " | Version: " + foundApp.version +
            " | ZIP size: " + foundApp.zip_blob_length.toString()
        );
        return foundApp;
    } else {
        return error("No micro-app found with ID: " + app_id);
    }
}


// Function to fetch all users from the database
public function fetchAllUsers() returns error? {

    // Define the query
    sql:ParameterizedQuery query = `SELECT * FROM users;`;

    // Execute the query and map results to User records
    stream<User, sql:Error?> resultStream = databaseClient->query(query);

    // Iterate through the stream
    check from User user in resultStream
        do {
            log:printInfo("User: " + user.first_name + " " + user.last_name + ", Email: " + user.email);
        };
}

// function to fetch a user by email
public function fetchUserByEmail(string email) returns User|error {

    sql:ParameterizedQuery query = `SELECT * FROM users WHERE email = ${email};`;

    stream<User, sql:Error?> resultStream = databaseClient->query(query);

    User? foundUser = check from User user in resultStream
                        do {
                            return user; // return the first match
                        };

    if foundUser is User {
        log:printInfo("Found user: " + foundUser.toString());
        return foundUser;
    } else {
        return error("No user found with email: " + email);
    }
}

