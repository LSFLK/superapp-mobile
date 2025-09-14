// // Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
// //
// // WSO2 LLC. licenses this file to you under the Apache License,
// // Version 2.0 (the "License"); you may not use this file except
// // in compliance with the License.
// // You may obtain a copy of the License at
// //
// // http://www.apache.org/licenses/LICENSE-2.0
// //
// // Unless required by applicable law or agreed to in writing,
// // software distributed under the License is distributed on an
// // "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// // KIND, either express or implied.  See the License for the
// // specific language governing permissions and limitations
// // under the License.
// import ballerina/log;
// import ballerina/sql;

// # Get list of all MicroApp IDs for given groups.
// #
// # + groups - User's groups
// # + return - Array of MicroApp IDs or an error
// isolated function getMicroAppIdsByGroups(string[] groups) returns string[]|error {
//     stream<MicroAppId, sql:Error?> appIdStream = databaseClient->query(getMicroAppIdsByGroupsQuery(groups));
//     string[] appIds = check from MicroAppId microAppId in appIdStream
//         select microAppId.appId;

//     if appIds.length() == 0 {
//         log:printWarn(string `No Micro Apps found for the given groups : ${groups.toString()}`);
//         return [];
//     }
//     return appIds;
// }

// # Get list of all MicroApps with latest versions for given groups.
// #
// # + groups - User's groups
// # + return - Array of MicroApps or an error
// public isolated function getMicroApps(string[] groups) returns MicroApp[]|error {
//     string[] appIds = check getMicroAppIdsByGroups(groups);

//     stream<MicroApp, sql:Error?> appStream = databaseClient->query(getMicroAppsByAppIdsQuery(appIds));
//     MicroApp[] microApps = check from MicroApp microApp in appStream
//         order by microApp.name ascending
//         select microApp;

//     if microApps.length() == 0 {
//         return [];
//     }

//     foreach MicroApp microApp in microApps {
//         stream<MicroAppVersion, sql:Error?> versionStream =
//             databaseClient->query(getAllMicroAppVersionsQuery(microApp.appId));
//         MicroAppVersion[] versions = check from MicroAppVersion version in versionStream
//             select version;
//         microApp.versions = versions;
//     }

//     return microApps;
// }

// # Get MicroApp by ID.
// #
// # + groups - User groups
// # + appId - ID of the MicroApp
// # + return - MicroApp, nil or an error
// public isolated function getMicroAppById(string appId, string[] groups) returns MicroApp?|error {
//     string[] appIds = check getMicroAppIdsByGroups(groups);
//     if appIds.indexOf(appId) == () {
//         return;
//     }

//     MicroApp|error microApp = databaseClient->queryRow(getMicroAppByAppIdQuery(appId));
//     if microApp is sql:NoRowsError {
//         return;
//     }
//     if microApp is error {
//         return microApp;
//     }

//     stream<MicroAppVersion, sql:Error?> versionStream =
//         databaseClient->query(getAllMicroAppVersionsQuery(microApp.appId));
//     MicroAppVersion[] versions = check from MicroAppVersion microAppVersion in versionStream
//         select microAppVersion;

//     microApp.versions = versions;
//     return microApp;
// }

// # Get all the versions of the SuperApp for a given platform.
// #
// # + platform - Platform ios|android
// # + return - Array of Super App versions or an error
// public isolated function getVersionsByPlatform(string platform) returns Version[]|error {
//     stream<Version, sql:Error?> versionStream =
//         databaseClient->query(getVersionsByPlatformQuery(platform));
//     return from Version version in versionStream
//         select version;
// }

// # Get all the app configurations for a given user email.
// #
// # + email - email address of the user
// # + return - Array of app configurations or else an error
// public isolated function getAppConfigsByEmail(string email) returns AppConfig[]|error {
//     stream<AppConfig, sql:Error?> configStream =
//         databaseClient->query(getAppConfigsByEmailQuery(email));
//     return from AppConfig appConfig in configStream
//         select appConfig;
// }

// # Insert or update app configurations of the logged in user.
// #
// # + email - email of the user
// # + appConfig - App configurations to be inserted or updated
// # + return - Insert or update result, or an error
// public isolated function updateAppConfigsByEmail(string email, AppConfig appConfig)
//     returns ExecutionSuccessResult|error {

//     sql:ParameterizedQuery query = updateAppConfigsByEmailQuery(
//         email,
//         appConfig.configKey,
//         appConfig.configValue.toJsonString(),
//         appConfig.isActive);
//     sql:ExecutionResult result = check databaseClient->execute(query);
//     return result.cloneWithType(ExecutionSuccessResult);
// }
