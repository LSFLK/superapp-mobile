import ballerinax/mysql.driver as _;
import ballerina/log;
import ballerina/sql;
import ballerina/io;


// Function to insert a micro-app with a ZIP file
public isolated function insertMicroAppWithZip(string name, string version, byte[] zipData, string appId, string iconUrlPath, string description) returns error? {

    // Parameterized query to insert into micro_apps
    //sql:ParameterizedQuery query = `INSERT INTO micro_apps (name, version, zip_blob, app_id) VALUES (${name}, ${version}, ${zipData}, ${appId});`;
    sql:ParameterizedQuery query = `
    INSERT INTO micro_apps (name, version, zip_blob, app_id, icon_url, description)
    VALUES (${name}, ${version}, ${zipData}, ${appId}, ${iconUrlPath}, ${description})
    ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        version = VALUES(version),
        zip_blob = VALUES(zip_blob),
        icon_url = VALUES(icon_url),
        created_at = CURRENT_TIMESTAMP,
        description = VALUES(description);
    `;

    // Execute the query
    sql:ExecutionResult result = check databaseClient->execute(query);

    io:println("Rows affected: " + result.affectedRowCount.toString());
    
}


// Function to insert the istalled app IDs for a user
public isolated function updateUserDownloadedApps(string email, json appIds) returns error? {
    
    // Convert the string[] into a JSON array string
    string appsJson = appIds.toJsonString();
    
    sql:ParameterizedQuery query = 
        `UPDATE users 
          SET downloaded_app_ids = ${appsJson} 
          WHERE email = ${email};`;

    sql:ExecutionResult result = check databaseClient->execute(query);

    io:println("Rows affected: " + result.affectedRowCount.toString());
}



// Function to fetch all micro-apps from the database
public isolated function fetchAllMicroApps() returns MicroApp[]|error {
    sql:ParameterizedQuery query = `
        SELECT app_id, name, version, LENGTH(zip_blob) AS zip_blob_length, created_at, description
        FROM micro_apps;
    `;
    
    stream<MicroApp, sql:Error?> resultStream = databaseClient->query(query);
    
    MicroApp[] microApps = [];
    check from var app in resultStream
        do {
            MicroApp updatedApp = {
                app_id: app.app_id,
                name: app.name,
                version: app.version,
                icon_url: app.icon_url,
                zip_blob_length: app.zip_blob_length,
                created_at: app.created_at,
                download_url: "https://41200aa1-4106-4e6c-babf-311dce37c04a-prod.e1-us-east-azure.choreoapis.dev/gov-superapp/superappbackendprodbranch/v1.0/micro-apps/" + app.app_id + "/download",
                description: app.description
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
    check resultStream.close();
    
    return microApps;
}

// Function to fetch a micro-app by its ID
public isolated function fetchMicroAppById(string app_id) returns MicroApp|error {
    sql:ParameterizedQuery query = `
        SELECT app_id, name, version, LENGTH(zip_blob) AS zip_blob_length, created_at, description
        FROM micro_apps
        WHERE app_id = ${app_id};
    `;
    
    stream<MicroApp, sql:Error?> resultStream = databaseClient->query(query);
    
    MicroApp? foundApp = check from var app in resultStream
        do {
            MicroApp updatedApp = {
                app_id: app.app_id,
                name: app.name,
                version: app.version,
                icon_url: app.icon_url,
                zip_blob_length: app.zip_blob_length,
                created_at: app.created_at,
                download_url: "https://41200aa1-4106-4e6c-babf-311dce37c04a-prod.e1-us-east-azure.choreoapis.dev/gov-superapp/superappbackendprodbranch/v1.0/micro-apps/" + app.app_id + "/download",
                description: app.description
            };
            return updatedApp;
        };
    check resultStream.close();
    
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
public isolated function fetchMicroAppZipById(string app_id) returns MicroAppDownload|error {
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
    
    check resultStream.close();

    if foundApp is MicroAppDownload {
        log:printInfo("Found ZIP for micro-app with app ID: " + app_id);
        return foundApp;
    } else {
        return error("No micro-app ZIP found with ID: " + app_id);
    }
}


// Function to fetch all users from the database
public isolated function fetchAllUsers() returns User[]|error {

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

    check resultStream.close();
    
    return users;
}

// function to fetch a user by email
public isolated function fetchUserByEmail(string email) returns User|error {

    //sql:ParameterizedQuery query = `SELECT * FROM users WHERE email = ${email};`;
    sql:ParameterizedQuery query = `SELECT user_id, first_name, last_name, email,
       COALESCE(downloaded_app_ids, JSON_ARRAY()) AS downloaded_app_ids
    FROM users WHERE email = ${email};`;


    stream<User, sql:Error?> resultStream = databaseClient->query(query);

    User? foundUser = check from User user in resultStream
                        do {
                            return user; // return the first match
                        };

    check resultStream.close();

    if foundUser is User {
        log:printInfo("Found user: " + foundUser.toString());
        return foundUser;
    } else {
        return error("No user found with email: " + email);
    }
}

public isolated function fetchMicroAppIconById(string app_id) returns MicroAppIcon|error {
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

    check resultStream.close();
    
    if foundIcon is MicroAppIcon {
        log:printInfo("Found icon for micro-app with app ID: " + app_id);
        return foundIcon;
    } else {
        return error("No icon found for micro-app with ID: " + app_id);
    }
}

function stopHandler() returns error? {
    io:println("Performing shutdown tasks...");
    // Add your cleanup logic here (e.g., close files, database connections)
    check databaseClient.close();
    io:println("Shutdown tasks completed.");
    return ();
}
