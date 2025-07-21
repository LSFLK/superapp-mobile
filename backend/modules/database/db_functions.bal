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

# Get list of all MicroApps with latest versions for given groups.
#
# + groups - User's groups
# + return - Array of MicroApps or an error
public isolated function getAllMicroApps(string[] groups) returns MicroApp[]|error {
    stream<MicroAppId, sql:Error?> appIdStream = databaseClient->query(getMicroAppIdsAllowedForGroups(groups));
    string[] appIds = check from var result in appIdStream
        select result.appId;

    if appIds.length() == 0 {
        log:printWarn(string `No Microapps found for the given groups : ${groups.toString()}`);
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
        MicroAppVersion[] versions = check from var version in versionStream
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
    stream<MicroAppId, sql:Error?> appIdStream = databaseClient->query(getMicroAppIdsAllowedForGroups(groups));
    string[] appIds = check from MicroAppId microAppId in appIdStream
        select microAppId.appId;

    if appIds.length() == 0 || appIds.indexOf(appId) == () {
        return;
    }

    stream<MicroApp, sql:Error?> appStream = databaseClient->query(getMicroAppByIdQuery(appId));
    MicroApp[] microApps = check from var result in appStream
        select result;

    if microApps.length() == 0 {
        return ();
    }

    MicroApp microApp = microApps[0];
    stream<MicroAppVersion, sql:Error?> versionStream =
        databaseClient->query(getAllMicroAppVersionsQuery(microApp.appId));
    MicroAppVersion[] versions = check from MicroAppVersion microAppVersion in versionStream
        select microAppVersion;
    microApp.versions = versions;

    return microApp;
}

# Get all the versions of the SuperApp for a given platform.
#
# + platform - Platform ios|android
# + return - Array of SuperAppVersions or an error
public isolated function getSuperAppVersionsByPlatform(string platform) returns SuperAppVersion[]|error {
    stream<SuperAppVersion, sql:Error?> versionStream =
        databaseClient->query(getSuperAppVersionsByPlatformQuery(platform));
    return from SuperAppVersion superAppVersion in versionStream
        select superAppVersion;
}

# Get all the user configurations for a given email.
#
# + email - email address of the user
# + return - Array of UserConfigurations or else an error
public isolated function getUserConfigurationsByEmail(string email) returns UserConfiguration[]|error {
    stream<UserConfiguration, sql:Error?> configStream =
        databaseClient->query(getUserConfigurationsByEmailQuery(email));
    return from var config in configStream
        select config;
}

# Insert or update user configurations.
#
# + email - email of the user
# + configuration - configuration to be inserted or updated
# + return - Insert or update result, or an error
public isolated function updateUserConfigurationByEmail(string email, UserConfiguration configuration)
    returns ExecutionSuccessResult|error {

    sql:ParameterizedQuery query = updateUserConfigurationsQuery(
        email,
        configuration.configKey,
        configuration.configValue.toJsonString(),
        configuration.isActive);
    sql:ExecutionResult result = check databaseClient->execute(query);
    return result.cloneWithType(ExecutionSuccessResult);
}
