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

// Record for micro_app
type MicroApp record {
    int micro_app_id;
    string app_id;
    string name;
    string version;
    byte[]? icon_url;
    int? zip_blob_length;   // size in bytes
    string? created_at;     // timestamp as string
    string download_url;
};

// MicroAppDownload type for fetching ZIP blob
type MicroAppDownload record {
    byte[] zip_blob;
};

// MicroAppIcon type for fetching icon blob
type MicroAppIcon record {
    byte[] icon_url;
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
public function insertMicroAppWithZip(string name, string version, string zipFilePath, string appId, string iconUrlPath) returns error? {

    // Read ZIP file from local path
    byte[] zipData = check io:fileReadBytes(zipFilePath);

    // Parameterized query to insert into micro_apps
    //sql:ParameterizedQuery query = `INSERT INTO micro_apps (name, version, zip_blob, app_id) VALUES (${name}, ${version}, ${zipData}, ${appId});`;
    sql:ParameterizedQuery query = `
    INSERT INTO micro_apps (name, version, zip_blob, app_id, icon_url)
    VALUES (${name}, ${version}, ${zipData}, ${appId}, ${iconUrlPath})
    ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        version = VALUES(version),
        zip_blob = VALUES(zip_blob),
        icon_url = VALUES(icon_url),
        created_at = CURRENT_TIMESTAMP;
    `;

    // Execute the query
    sql:ExecutionResult result = check databaseClient->execute(query);

    io:println("Rows affected: " + result.affectedRowCount.toString());
}

// Function to fetch all micro-apps from the database
public function fetchAllMicroApps() returns MicroApp[]|error {
    sql:ParameterizedQuery query = `
        SELECT micro_app_id, app_id, name, version, LENGTH(zip_blob) AS zip_blob_length, created_at
        FROM micro_apps;
    `;
    
    stream<MicroApp, sql:Error?> resultStream = databaseClient->query(query);
    
    MicroApp[] microApps = [];
    check from var app in resultStream
        do {
            MicroApp updatedApp = {
                micro_app_id: app.micro_app_id,
                app_id: app.app_id,
                name: app.name,
                version: app.version,
                icon_url: app.icon_url,
                zip_blob_length: app.zip_blob_length,
                created_at: app.created_at,
                download_url: "http://localhost:9090/micro-apps/" + app.app_id + "/download"
            };
            log:printInfo(
                "MicroApp: " + updatedApp.name +
                " | App ID: " + updatedApp.app_id +
                " | Version: " + updatedApp.version +
                " | ZIP size: " + updatedApp.zip_blob_length.toString() +
                " | Created at: " + updatedApp.created_at.toString() +
                " | Download URL: " + updatedApp.download_url
            );
            microApps.push(updatedApp);
        };
    
    return microApps;
}

// Function to fetch a micro-app by its ID
public function fetchMicroAppById(string app_id) returns MicroApp|error {
    sql:ParameterizedQuery query = `
        SELECT micro_app_id, app_id, name, version, LENGTH(zip_blob) AS zip_blob_length, created_at
        FROM micro_apps
        WHERE app_id = ${app_id};
    `;
    
    stream<MicroApp, sql:Error?> resultStream = databaseClient->query(query);
    
    MicroApp? foundApp = check from var app in resultStream
        do {
            MicroApp updatedApp = {
                micro_app_id: app.micro_app_id,
                app_id: app.app_id,
                name: app.name,
                version: app.version,
                icon_url: app.icon_url,
                zip_blob_length: app.zip_blob_length,
                created_at: app.created_at,
                download_url: "http://localhost:9090/micro-apps/" + app.app_id + "/download"
            };
            return updatedApp;
        };
    
    if foundApp is MicroApp {
        log:printInfo(
            "Found MicroApp: " + foundApp.name +
            " | App ID: " + foundApp.app_id +
            " | Version: " + foundApp.version +
            " | ZIP size: " + foundApp.zip_blob_length.toString() +
            " | Download URL: " + foundApp.download_url
        );
        return foundApp;
    } else {
        return error("No micro-app found with ID: " + app_id);
    }
}

// Function to fetch the ZIP blob of a micro-app by its ID
public function fetchMicroAppZipById(string app_id) returns MicroAppDownload|error {
    sql:ParameterizedQuery query = `
        SELECT zip_blob
        FROM micro_apps
        WHERE app_id = ${app_id};
    `;
    
    stream<MicroAppDownload, sql:Error?> resultStream = databaseClient->query(query);
    
    MicroAppDownload? foundApp = check from MicroAppDownload app in resultStream
        do {
            return app;
        };
    
    if foundApp is MicroAppDownload {
        log:printInfo("Found ZIP for micro-app with app ID: " + app_id);
        return foundApp;
    } else {
        return error("No micro-app ZIP found with ID: " + app_id);
    }
}


// Function to fetch all users from the database
public function fetchAllUsers() returns User[]|error {

    // Define the query
    sql:ParameterizedQuery query = `SELECT * FROM users;`;

    // Execute the query and map results to User records
    stream<User, sql:Error?> resultStream = databaseClient->query(query);

    // Iterate through the stream
    User[] users = [];
    check from User user in resultStream
        do {
            log:printInfo("User: " + user.first_name + " " + user.last_name + ", Email: " + user.email);
            users.push(user);
        };
    
    return users;
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

public function fetchMicroAppIconById(string app_id) returns MicroAppIcon|error {
    sql:ParameterizedQuery query = `
        SELECT icon_url
        FROM micro_apps
        WHERE app_id = ${app_id};
    `;
    
    stream<MicroAppIcon, sql:Error?> resultStream = databaseClient->query(query);
    
    MicroAppIcon? foundIcon = check from MicroAppIcon icon in resultStream
        do {
            return icon;
        };
    
    if foundIcon is MicroAppIcon {
        log:printInfo("Found icon for micro-app with app ID: " + app_id);
        return foundIcon;
    } else {
        return error("No icon found for micro-app with ID: " + app_id);
    }
}