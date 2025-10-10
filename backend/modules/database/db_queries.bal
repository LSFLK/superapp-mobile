import ballerina/sql;

// ============================================================================
// Micro-App Queries
// ============================================================================

// Insert or update micro-app with ZIP file
public isolated function getInsertMicroAppQuery(
    string name, 
    string version, 
    byte[] zipData, 
    string appId, 
    string iconUrlPath, 
    string description
) returns sql:ParameterizedQuery {
    return `
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
}

// Fetch all micro-apps with metadata (excluding binary data)
public isolated function getSelectAllMicroAppsQuery() returns sql:ParameterizedQuery {
    return `
        SELECT app_id, name, version, icon_url, LENGTH(zip_blob) AS zip_blob_length, created_at, description
        FROM micro_apps;
    `;
}

// Fetch single micro-app by ID
public isolated function getSelectMicroAppByIdQuery(string appId) returns sql:ParameterizedQuery {
    return `
        SELECT app_id, name, version, icon_url, LENGTH(zip_blob) AS zip_blob_length, created_at, description
        FROM micro_apps
        WHERE app_id = ${appId};
    `;
}

// Fetch micro-app ZIP blob by ID
public isolated function getSelectMicroAppZipQuery(string appId) returns sql:ParameterizedQuery {
    return `
        SELECT zip_blob
        FROM micro_apps
        WHERE app_id = ${appId};
    `;
}

// Fetch micro-app icon by ID
public isolated function getSelectMicroAppIconQuery(string appId) returns sql:ParameterizedQuery {
    return `
        SELECT icon_url
        FROM micro_apps
        WHERE app_id = ${appId};
    `;
}

// ============================================================================
// User Queries
// ============================================================================

// Update user's downloaded apps
public isolated function getUpdateUserDownloadedAppsQuery(string email, string appsJson) returns sql:ParameterizedQuery {
    return `
        UPDATE users 
        SET downloaded_app_ids = ${appsJson} 
        WHERE email = ${email};
    `;
}

// Fetch all users
public isolated function getSelectAllUsersQuery() returns sql:ParameterizedQuery {
    return `
        SELECT * FROM users;
    `;
}

// Fetch user by email
public isolated function getSelectUserByEmailQuery(string email) returns sql:ParameterizedQuery {
    return `
        SELECT user_id, first_name, last_name, email,
            COALESCE(downloaded_app_ids, JSON_ARRAY()) AS downloaded_app_ids
        FROM users 
        WHERE email = ${email};
    `;
}

// ============================================================================
// Health Check Queries
// ============================================================================

// Database health check query
public isolated function getHealthCheckQuery() returns sql:ParameterizedQuery {
    return `SELECT 1 as value`;
}
