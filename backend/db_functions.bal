import ballerina/sql;

// Function to insert a micro-app with a ZIP file
public isolated function insertMicroAppWithZip(string name, string version, byte[] zipData, string appId, string iconUrlPath, string description) returns error? {

    createLog("INFO", "Inserting or updating micro app", { "appId": appId, "name": name, "version": version });

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

    createLog("INFO", "Micro app insert/update completed", { "appId": appId, "rowsAffected": result.affectedRowCount.toString() });
}


// Function to insert the istalled app IDs for a user
public isolated function updateUserDownloadedApps(string email, json appIds) returns error? {

    createLog("INFO", "Updating downloaded apps for user", { "email": email, "appIds": appIds.toString() });
    
    // Convert the string[] into a JSON array string
    string appsJson = appIds.toJsonString();
    
    sql:ParameterizedQuery query = 
        `UPDATE users 
          SET downloaded_app_ids = ${appsJson} 
          WHERE email = ${email};`;

    sql:ExecutionResult result = check databaseClient->execute(query);

    createLog("INFO", "User downloaded apps updated", { "email": email, "rowsAffected": result.affectedRowCount.toString() });
}



// Function to fetch all micro-apps from the database
public isolated function fetchAllMicroApps() returns MicroApp[]|error {

    createLog("INFO", "Fetching all micro apps", {});

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
            microApps.push(updatedApp);
        };
    check resultStream.close();

    createLog("INFO", "Completed fetching all micro apps", { "totalApps": microApps.length() });
    
    return microApps;
}

// Function to fetch a micro-app by its ID
public isolated function fetchMicroAppById(string app_id) returns MicroApp|error {

    createLog("INFO", "Fetching micro app by ID", { "appId": app_id });

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
        createLog("INFO", "Micro app found", { "appId": foundApp.app_id, "name": foundApp.name, "zipSize": foundApp.zip_blob_length.toString() });
        return foundApp;
    } else {
        createLog("WARN", "Micro app not found", { "appId": app_id });
        return error("No micro-app found with ID: " + app_id);
    }
}

// Function to fetch the ZIP blob of a micro-app by its ID
public isolated function fetchMicroAppZipById(string app_id) returns MicroAppDownload|error {

    createLog("INFO", "Fetching ZIP blob for micro-app", { "appId": app_id });

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
        createLog("INFO", "Found ZIP for micro-app", { "appId": app_id, "zipSize": foundApp.zip_blob.length() });
        return foundApp;
    } else {
        createLog("WARN", "No ZIP found for micro-app", { "appId": app_id });
        return error("No micro-app ZIP found with ID: " + app_id);
    }
}


// Function to fetch all users from the database
public isolated function fetchAllUsers() returns User[]|error {

    createLog("INFO", "Fetching all users", {});

    // Define the query
    sql:ParameterizedQuery query = `SELECT * FROM users;`;

    // Execute the query and map results to User records
    stream<User, sql:Error?> resultStream = databaseClient->query(query);

    // Iterate through the stream
    User[] users = [];
    check from User user in resultStream
        do {
            createLog("INFO", "Fetched user", { "email": user.email, "name": user.first_name + " " + user.last_name });
            users.push(user);
        };

    check resultStream.close();

    createLog("INFO", "Completed fetching all users", { "totalUsers": users.length() });
    
    return users;
}

// function to fetch a user by email
public isolated function fetchUserByEmail(string email) returns User|error {

    createLog("INFO", "Fetching user by email", { "email": email });

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
        createLog("INFO", "User found", { "email": foundUser.email, "name": foundUser.first_name + " " + foundUser.last_name });
        return foundUser;
    } else {
        createLog("WARN", "No user found with email", { "email": email });
        return error("No user found with email: " + email);
    }
}

public isolated function fetchMicroAppIconById(string app_id) returns MicroAppIcon|error {

    createLog("INFO", "Fetching micro app icon", { "appId": app_id });

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
        createLog("INFO", "Icon fetched for micro-app", { "appId": app_id, "iconUrl": foundIcon.icon_url });
        return foundIcon;
    } else {
        createLog("WARN", "No icon found for micro-app", { "appId": app_id });
        return error("No icon found for micro-app with ID: " + app_id);
    }
}

function stopHandler() returns error? {
    createLog("INFO", "Performing shutdown tasks, closing database connection", {});
    // Add your cleanup logic here (e.g., close files, database connections)
    check databaseClient.close();
    createLog("INFO", "Shutdown completed successfully", {});
    return ();
}
