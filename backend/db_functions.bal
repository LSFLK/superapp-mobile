import ballerina/sql;

// Function to insert a micro-app with a ZIP file
public isolated function insertMicroAppWithZip(string name, string version, byte[] zipData, string appId, string iconUrlPath, string description) returns error? {

    LogRecord logRecord = {
        level: "INFO",
        message: "Inserting or updating micro app",
        context: { "appId": appId, "name": name, "version": version }
    };
    createLog(logRecord);

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

    logRecord = {
        level: "INFO",
        message: "Micro app insert/update completed",
        context: { "appId": appId, "rowsAffected": result.affectedRowCount.toString() }
    };
    createLog(logRecord);   
}


// Function to insert the istalled app IDs for a user
public isolated function updateUserDownloadedApps(string email, json appIds) returns error? {

    LogRecord logRecord = {
        level: "INFO",
        message: "Updating downloaded apps for user",
        context: { "email": email, "appIds": appIds.toString() }
    };
    createLog(logRecord);
    
    // Convert the string[] into a JSON array string
    string appsJson = appIds.toJsonString();
    
    sql:ParameterizedQuery query = 
        `UPDATE users 
          SET downloaded_app_ids = ${appsJson} 
          WHERE email = ${email};`;

    sql:ExecutionResult result = check databaseClient->execute(query);

    logRecord = {
        level: "INFO",
        message: "User downloaded apps updated",
        context: { "email": email, "rowsAffected": result.affectedRowCount.toString() }
    };
    createLog(logRecord);
}



// Function to fetch all micro-apps from the database
public isolated function fetchAllMicroApps() returns MicroApp[]|error {

    LogRecord logRecord = {
        level: "INFO",
        message: "Fetching all micro apps"
    };
    createLog(logRecord);

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

    logRecord = {
        level: "INFO",
        message: "Completed fetching all micro apps",
        context: { "totalApps": microApps.length() }
    };
    createLog(logRecord);
    
    return microApps;
}

// Function to fetch a micro-app by its ID
public isolated function fetchMicroAppById(string app_id) returns MicroApp|error {

    LogRecord logRecord = {
        level: "INFO",
        message: "Fetching micro app by ID",
        context: { "appId": app_id }
    };
    createLog(logRecord);

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
        logRecord = {
            level: "INFO",
            message: "Micro app found",
            context: { "appId": foundApp.app_id, "name": foundApp.name, "zipSize": foundApp.zip_blob_length.toString() }
        };
        createLog(logRecord);
        return foundApp;
    } else {
        logRecord = {
            level: "WARN",
            message: "Micro app not found",
            context: { "appId": app_id }
        };
        createLog(logRecord);
        return error("No micro-app found with ID: " + app_id);
    }
}

// Function to fetch the ZIP blob of a micro-app by its ID
public isolated function fetchMicroAppZipById(string app_id) returns MicroAppDownload|error {

    LogRecord logRecord = {
        level: "INFO",
        message: "Fetching ZIP blob for micro-app",
        context: { "appId": app_id }
    };
    createLog(logRecord);

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
        logRecord = {
            level: "INFO",
            message: "Found ZIP for micro-app",
            context: { "appId": app_id, "zipSize": foundApp.zip_blob.length() }
        };
        createLog(logRecord);
        return foundApp;
    } else {
        logRecord = {
            level: "WARN",
            message: "No ZIP found for micro-app",
            context: { "appId": app_id }
        };
        createLog(logRecord);  
        return error("No micro-app ZIP found with ID: " + app_id);
    }
}


// Function to fetch all users from the database
public isolated function fetchAllUsers() returns User[]|error {

    LogRecord logRecord = {
        level: "INFO",
        message: "Fetching all users"
    };
    createLog(logRecord);

    // Define the query
    sql:ParameterizedQuery query = `SELECT * FROM users;`;

    // Execute the query and map results to User records
    stream<User, sql:Error?> resultStream = databaseClient->query(query);

    // Iterate through the stream
    User[] users = [];
    check from User user in resultStream
        do {
            logRecord = {
                level: "INFO",
                message: "Fetched user",
                context: { "email": user.email, "name": user.first_name + " " + user.last_name }
            };
            createLog(logRecord);

            users.push(user);
        };

    check resultStream.close();

    logRecord = {
        level: "INFO",
        message: "Completed fetching all users",
        context: {"totalUsers": users.length() }
    };
    createLog(logRecord);
    
    return users;
}

// function to fetch a user by email
public isolated function fetchUserByEmail(string email) returns User|error {

    LogRecord logRecord = {
        level: "INFO",
        message: "Fetching user by email",
        context: { "email": email }
    };
    createLog(logRecord);

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
        logRecord = {
            level: "INFO",
            message: "User found",
            context: { "email": foundUser.email, "name": foundUser.first_name + " " + foundUser.last_name }
        };
        createLog(logRecord);
        return foundUser;
    } else {
        logRecord = {
            level: "WARN",
            message: "No user found with email",
            context: { "email": email }
        };
        createLog(logRecord);
        return error("No user found with email: " + email);
    }
}

public isolated function fetchMicroAppIconById(string app_id) returns MicroAppIcon|error {

    LogRecord logRecord = {
        level: "INFO",
        message: "Fetching micro app icon",
        context: { "appId": app_id }
    };
    createLog(logRecord);

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
        logRecord = {
            level: "INFO",
            message: "Icon fetched for micro-app",
            context: { "appId": app_id, "iconUrl": foundIcon.icon_url }
        };
        createLog(logRecord);
        return foundIcon;
    } else {
        logRecord = {
            level: "WARN",
            message: "No icon found for micro-app",
            context: { "appId": app_id }
        };
        createLog(logRecord);
        return error("No icon found for micro-app with ID: " + app_id);
    }
}

function stopHandler() returns error? {
    LogRecord logRecord = {
        level: "INFO",
        message: "Performing shutdown tasks, closing database connection"
    };
    createLog(logRecord);
    // Add your cleanup logic here (e.g., close files, database connections)
    check databaseClient.close();
    
    logRecord = {
        level: "INFO",
        message: "Shutdown completed successfully"
    };
    createLog(logRecord);
    
    return ();
}
