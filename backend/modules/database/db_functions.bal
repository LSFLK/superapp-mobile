// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.
import ballerina/log;
import ballerina/sql;

# Get list of all MicroApp IDs for given groups.
#
# + groups - User's groups
# + return - Array of MicroApp IDs or an error
isolated function getMicroAppIdsByGroups(string[] groups) returns string[]|error {
    if groups.length() == 0 {
        log:printWarn("No groups found for the user");
        return [];
    }
    stream<MicroAppId, sql:Error?> appIdStream = databaseClient->query(getMicroAppIdsByGroupsQuery(groups));
    string[] appIds = check from MicroAppId microAppId in appIdStream
        select microAppId.appId;

    if appIds.length() == 0 {
        log:printWarn(string `No Micro Apps found for the given groups : ${groups.toString()}`);
        return [];
    }
    return appIds;
}

# Get list of all MicroApps with latest versions for given groups.
#
# + groups - User's groups
# + return - Array of MicroApps or an error
public isolated function getMicroApps(string[] groups) returns MicroApp[]|error {
    string[] appIds = check getMicroAppIdsByGroups(groups);

    if appIds.length() == 0 {
        log:printWarn("No groups found for the user");
        return [];
    }

    stream<MicroApp, sql:Error?> appStream = databaseClient->query(getMicroAppsByAppIdsQuery(appIds));
    MicroApp[] microApps = check from MicroApp microApp in appStream
        order by microApp.name ascending
        select microApp;

    if microApps.length() == 0 {
        return [];
    }

    foreach MicroApp microApp in microApps {
        stream<MicroAppVersion, sql:Error?> versionStream =
            databaseClient->query(getAllMicroAppVersionsQuery(microApp.appId));
        MicroAppVersion[] versions = check from MicroAppVersion version in versionStream
            select version;
        microApp.versions = versions;
    }

    return microApps;
}

# Get MicroApp by ID.
#
# + groups - User groups
# + appId - ID of the MicroApp
# + return - MicroApp, nil or an error
public isolated function getMicroAppById(string appId, string[] groups) returns MicroApp?|error {
    string[] appIds = check getMicroAppIdsByGroups(groups);
    if appIds.indexOf(appId) == () {
        return;
    }

    MicroApp|error microApp = databaseClient->queryRow(getMicroAppByAppIdQuery(appId));
    if microApp is sql:NoRowsError {
        return;
    }
    if microApp is error {
        return microApp;
    }

    stream<MicroAppVersion, sql:Error?> versionStream =
        databaseClient->query(getAllMicroAppVersionsQuery(microApp.appId));
    MicroAppVersion[] versions = check from MicroAppVersion microAppVersion in versionStream
        select microAppVersion;

    microApp.versions = versions;
    return microApp;
}

# Inserts or updates a MicroApp and its role and versions into the database.
#
# + microApp - MicroApp record to insert/update
# + createdBy - User who performs the operation
# + return - ExecutionSuccessResult on success or error
public isolated function upsertMicroApp(MicroApp microApp, string createdBy) returns ExecutionSuccessResult|error {
    sql:ExecutionResult result = check databaseClient->execute(upsertMicroAppQuery(microApp, createdBy));
    if microApp.roles.length() > 0 {
        foreach MicroAppRole appRole in microApp.roles {
            _ = check databaseClient->execute(upsertMicroAppRoleQuery(microApp.appId, appRole, createdBy));
        }
    }

    if microApp.versions.length() > 0 {
        foreach MicroAppVersion version in microApp.versions {
            _ = check databaseClient->execute(upsertMicroAppVersionQuery(microApp.appId, version, createdBy));
        }
    }

    return result.cloneWithType(ExecutionSuccessResult);
}

# Inserts or updates a single MicroApp version into the database.
#
# + appId - MicroApp ID to which this version belongs
# + version - MicroAppVersion record to insert/update
# + createdBy - User who performs the operation
# + return - ExecutionSuccessResult on success or error
public isolated function upsertMicroAppVersion(string appId, MicroAppVersion version, string createdBy) 
    returns ExecutionSuccessResult|error {
        
    sql:ExecutionResult result = check databaseClient->execute(upsertMicroAppVersionQuery(appId, version, createdBy));
    if result.affectedRowCount == 0 {
        return error("Failed to add micro app version.");
    }

    return result.cloneWithType(ExecutionSuccessResult);
}

# Inserts or updates a role mapping for a MicroApp.
#
# + appId - MicroApp ID to which this role mapping belongs
# + appRole - MicroAppRole record containing the role name
# + createdBy - User who performs the operation
# + return - ExecutionSuccessResult on success or error
public isolated function upsertMicroAppRole(string appId, MicroAppRole appRole, string createdBy) 
    returns ExecutionSuccessResult|error {

    sql:ExecutionResult result = check databaseClient->execute(upsertMicroAppRoleQuery(appId, appRole, createdBy));
    if result.affectedRowCount == 0 {
        return error("Failed to add micro app role mapping.");
    }

    return result.cloneWithType(ExecutionSuccessResult);
}

# Deletes (soft delete) a MicroApp by setting active = 0.
# Also cascades the soft delete to related versions and role mappings.
#
# + appId - MicroApp ID to delete
# + updatedBy - User who performs the deletion
# + return - ExecutionSuccessResult on success or error
public isolated function deleteMicroApp(string appId, string updatedBy) returns ExecutionSuccessResult|error {
    sql:ExecutionResult result = check databaseClient->execute(deleteMicroAppQuery(appId, updatedBy));
    if result.affectedRowCount == 0 {
        return error("No matching micro app found to delete.");
    }

    _ = check databaseClient->execute(deleteMicroAppVersionQuery(appId, updatedBy));
    _ = check databaseClient->execute(deleteMicroAppRoleQuery(appId, updatedBy));
    return result.cloneWithType(ExecutionSuccessResult);
}

# Get all the versions of the SuperApp for a given platform.
#
# + platform - Platform ios|android
# + return - Array of Super App versions or an error
public isolated function getVersionsByPlatform(string platform) returns Version[]|error {
    stream<Version, sql:Error?> versionStream =
        databaseClient->query(getVersionsByPlatformQuery(platform));
    return from Version version in versionStream
        select version;
}

# Get all the app configurations for a given user email.
#
# + email - email address of the user
# + return - Array of app configurations or else an error
public isolated function getAppConfigsByEmail(string email) returns AppConfig[]|error {
    stream<AppConfig, sql:Error?> configStream =
        databaseClient->query(getAppConfigsByEmailQuery(email));
    return from AppConfig appConfig in configStream
        select appConfig;
}

# Insert or update app configurations of the logged in user.
#
# + email - email of the user
# + appConfig - App configurations to be inserted or updated
# + return - Insert or update result, or an error
public isolated function updateAppConfigsByEmail(string email, AppConfig appConfig)
    returns ExecutionSuccessResult|error {

    sql:ParameterizedQuery query = updateAppConfigsByEmailQuery(
            email,
            appConfig.configKey,
            appConfig.configValue.toJsonString(),
            appConfig.isActive);
    sql:ExecutionResult result = check databaseClient->execute(query);
    return result.cloneWithType(ExecutionSuccessResult);
}

public isolated function getUserInfoByEmail(string email) returns User|error? {
    User|error? userInfo = check databaseClient->queryRow(getUserInfoByEmailQuery(email));
    return userInfo;
}

# Create or update user information in the database.
#
# + email - User's email address
# + firstName - User's first name
# + lastName - User's last name
# + userThumbnail - URL to user's profile picture
# + location - User's location
# + return - ExecutionSuccessResult on success or error
public isolated function createUserInfo(string email, string firstName, string lastName, 
    string? userThumbnail, string? location) returns error? {
    
    sql:ExecutionResult result = check databaseClient->execute(
        createUserInfoQuery(email, firstName, lastName, userThumbnail?:"", location?:"")
    );
    
    if result.affectedRowCount == 0 {
        return error("Failed to create or update user information.");
    }
}

# Create or update multiple users in the database.
#
# + users - Array of users to create/update
# + return - ExecutionSuccessResult on success or error
public isolated function createBulkUsers(User[] users) returns error? {
    int successCount = 0;
    int errorCount = 0;
    
    foreach User user in users {
        error? result = createUserInfo(
            user.workEmail,
            user.firstName,
            user.lastName,
            user.userThumbnail ?: "",
            user.location ?: ""
        );
        
        if result is error {
            errorCount += 1;
        } else {
            successCount += 1;
        }
    }
    
    if errorCount > 0 {
        return error(string `Bulk user creation completed with errors: ${successCount} succeeded, ${errorCount} failed`);
    }
}

# Get all users from the database.
#
# + return - Array of User records or error
public isolated function getAllUsers() returns User[]|error {
    stream<User, sql:Error?> userStream = databaseClient->query(getAllUsersQuery());
    User[] users = check from User user in userStream select user;
    check userStream.close();
    return users;
}

# Delete a user from the database.
#
# + email - User's email address
# + return - ExecutionSuccessResult on success or error
public isolated function deleteUser(string email) returns error? {
    sql:ExecutionResult result = check databaseClient->execute(deleteUserQuery(email));
    
    if result.affectedRowCount == 0 {
        return error("User not found or already deleted.");
    }
}
