import ballerina/sql;

import superapp_backend.auth;

// ============================================================================
// Micro-App Functions
// ============================================================================

// Function to insert a micro-app with a ZIP file
public isolated function insertMicroAppWithZip(string name, string version, byte[] zipData, string appId, string iconUrlPath, string description, string[]? allowedFunctions) returns error? {
    string signedManifest = check auth:createSignedManifest(zipData, allowedFunctions);
    sql:ParameterizedQuery query = getInsertMicroAppQuery(name, version, zipData, appId, iconUrlPath, description, signedManifest);
    sql:ExecutionResult result = check databaseClient->execute(query);
    
}

// Function to fetch all micro-apps from the database
public isolated function fetchAllMicroApps() returns MicroApp[]|error {
    sql:ParameterizedQuery query = getSelectAllMicroAppsQuery();
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
                download_url: superappBaseUrl + "/micro-apps/" + app.app_id + "/download",
                description: app.description
            };
            microApps.push(updatedApp);
        };
    check resultStream.close();
    return microApps;
}

// Function to fetch a micro-app by its ID
public isolated function fetchMicroAppById(string app_id) returns MicroApp|error {
    sql:ParameterizedQuery query = getSelectMicroAppByIdQuery(app_id);
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
                download_url: superappBaseUrl + "/micro-apps/" + app.app_id + "/download",
                description: app.description
            };
            return updatedApp;
        };
    check resultStream.close();
    
    if foundApp is MicroApp {
        return foundApp;
    } else {
        return error("No micro-app found with ID: " + app_id);
    }
}

// Function to fetch the ZIP blob of a micro-app by its ID
public isolated function fetchMicroAppZipById(string app_id) returns MicroAppDownload|error {
    sql:ParameterizedQuery query = getSelectMicroAppZipQuery(app_id);
    
    stream<MicroAppDownload, sql:Error?> resultStream = databaseClient->query(query);  
    MicroAppDownload? foundApp = check from MicroAppDownload app in resultStream
        do {
            return app;
        };
    
    check resultStream.close();

    if foundApp is MicroAppDownload {
        return foundApp;
    } else {
        return error("No micro-app ZIP found with ID: " + app_id);
    }
}

// ============================================================================
// User Functions
// ============================================================================

// Function to update the installed app IDs for a user
public isolated function updateUserDownloadedApps(string email, json appIds) returns error? {
    string appsJson = appIds.toJsonString();
    sql:ParameterizedQuery query = getUpdateUserDownloadedAppsQuery(email, appsJson);
    sql:ExecutionResult result = check databaseClient->execute(query);
}

// Function to fetch all users from the database
public isolated function fetchAllUsers() returns User[]|error {
    sql:ParameterizedQuery query = getSelectAllUsersQuery();
    stream<User, sql:Error?> resultStream = databaseClient->query(query);

    User[] users = [];
    check from User user in resultStream
        do {
            users.push(user);
        };

    check resultStream.close();
    return users;
}

// Function to fetch a user by email
public isolated function fetchUserByEmail(string email) returns User|error {
    sql:ParameterizedQuery query = getSelectUserByEmailQuery(email);
    stream<User, sql:Error?> resultStream = databaseClient->query(query);

    User? foundUser = check from User user in resultStream
                        do {
                            return user; // return the first match
                        };

    check resultStream.close();

    if foundUser is User {
        return foundUser;
    } else {
        return error("No user found with email: " + email);
    }
}