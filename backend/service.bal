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
// import superapp_mobile_service.authorization;
// import superapp_mobile_service.database;
// import superapp_mobile_service.entity;

import ballerina/http;
import ballerina/log;

configurable int maxHeaderSize = 16384; // 16KB header size for WSO2 Choreo support
//configurable string[] restrictedAppsForNonLk = ?;
configurable string lkLocation = "Sri Lanka";
//configurable string mobileAppReviewerEmail = ?; // App store reviewer email

type MockUser record {|
    string employeeId;
    string name;
    string designation;
    string department;
|};

function getMockUsers() returns MockUser[] {
    return [      
        {
            "employeeId": "EMP001",
            "name": "John Doe",
            "designation": "Software Engineer",
            "department": "IT"
        },
        {
            "employeeId": "EMP002",
            "name": "Jane Smith",
            "designation": "Product Manager",
            "department": "IT"
        },
        {
            "employeeId": "EMP003",
            "name": "Michael Brown",
            "designation": "Accountant",
            "department": "Finance"
        },
        {
            "employeeId": "EMP004",
            "name": "Sarah Lee",
            "designation": "HR Executive",
            "department": "HR"
        },
        {
            "employeeId": "EMP005",
            "name": "Mark Town",
            "designation": "Team Lead",
            "department": "IT"
        },
        {
            "employeeId": "EMP006",
            "name": "Lisa Advani",
            "designation": "Finance Manager",
            "department": "Finance"
        }
    ];
}

@display {
    label: "SuperApp Mobile Service",
    id: "wso2-open-operations/superapp-mobile-service"
}
service class ErrorInterceptor {
    *http:ResponseErrorInterceptor;

    remote function interceptResponseError(error err, http:RequestContext ctx) returns http:BadRequest|error {
        if err is http:PayloadBindingError {
            string customError = "Payload binding failed!";
            log:printError(customError, err);
            return {
                body: {
                    message: customError
                }
            };
        }
        return err;
    }
}

service http:InterceptableService / on new http:Listener(9090, config = {requestLimits: {maxHeaderSize}}) {

    # + return - authorization:JwtInterceptor, ErrorInterceptor
    public function createInterceptors() returns http:Interceptor[] =>
    [new ErrorInterceptor()];

    // Get all mock users
    resource function get users/mock(http:RequestContext ctx) returns MockUser[] {
        return getMockUsers();
    }

    // Get a single mock user by employeeId
    resource function get users/mock/[string employeeId](http:RequestContext ctx) returns MockUser|http:NotFound {
        MockUser[] users = getMockUsers();
        foreach MockUser user in users {
            if user.employeeId == employeeId {
                log:printInfo("Found user: " + user.toString());
                return user;
            }
        }
        return <http:NotFound>{
            body: { message: "User not found for employeeId: " + employeeId }
        };
    }

    // public function createInterceptors() returns http:Interceptor[] =>
    //     [new authorization:JwtInterceptor(), new ErrorInterceptor()];

    // # Fetch user information of the logged in users.
    // #
    // # + ctx - Request context
    // # + return - User information object or an error
    // resource function get user\-info(http:RequestContext ctx) returns entity:Employee|http:InternalServerError {
    //     authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
    //     if userInfo is error {
    //         return {
    //             body: {
    //                 message: ERR_MSG_USER_HEADER_NOT_FOUND
    //             }
    //         };
    //     }

    //     entity:Employee|error loggedInUser = getUserInfo(userInfo.email);
    //     if loggedInUser is error {
    //         string customError = "Error occurred while retrieving user data!";
    //         log:printError(customError, loggedInUser);
    //         return {
    //             body: {
    //                 message: customError
    //             }
    //         };
    //     }

    //     error? cacheError = userInfoCache.put(userInfo.email, loggedInUser);
    //     if cacheError is error {
    //         log:printError("Error in updating the user cache!", cacheError);
    //     }

    //     return loggedInUser;
    // }
    
    // # Retrieves the list of micro apps available to the authenticated user.
    // #
    // # + ctx - Request context
    // # + return - A list of microapps if successful, or an error on failure
    // resource function get micro\-apps(http:RequestContext ctx) returns database:MicroApp[]|http:InternalServerError {
    //     authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
    //     if userInfo is error {
    //         return <http:InternalServerError>{
    //             body: {
    //                 message: ERR_MSG_USER_HEADER_NOT_FOUND
    //             }
    //         };
    //     }

    //     database:MicroApp[]|error allMicroApps = database:getMicroApps(userInfo.groups);
    //     if allMicroApps is error {
    //         string customError = "Error occurred while retrieving Micro Apps!";
    //         log:printError(customError, err = allMicroApps.message());
    //         return {
    //             body: {
    //                 message: customError
    //             }
    //         };
    //     }

    //     // Bypass the filtering for the app store reviewer
    //     if userInfo.email == mobileAppReviewerEmail {
    //         return allMicroApps;
    //     }

    //     entity:Employee|error? loggedInUser = getUserInfo(userInfo.email);
    //     if loggedInUser is error {
    //         string customError = "Error occurred while retrieving user data!";
    //         log:printError(customError, loggedInUser);
    //         return {
    //             body: {
    //                 message: customError
    //             }
    //         };
    //     }

    //     database:MicroApp[] filteredMicroApps = allMicroApps;

    //     if loggedInUser is entity:Employee && loggedInUser.location != lkLocation {
    //         filteredMicroApps = allMicroApps.filter(microapp => restrictedAppsForNonLk.indexOf(microapp.appId) is ());
    //     }

    //     return filteredMicroApps;
    // }

    // # Retrieves details of a specific micro app based on its App ID.
    // #
    // # + ctx - Request context
    // # + appId - ID of the micro app to retrieve
    // # + return - Single microapp, or errors on failure and not found
    // resource function get micro\-apps/[string appId](http:RequestContext ctx)
    //     returns database:MicroApp|http:InternalServerError|http:NotFound {

    //     authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
    //     if userInfo is error {
    //         return <http:InternalServerError>{
    //             body: {
    //                 message: ERR_MSG_USER_HEADER_NOT_FOUND
    //             }
    //         };
    //     }

    //     database:MicroApp|error? microApp = database:getMicroAppById(appId, userInfo.groups);

    //     if microApp is error {
    //         string customError = "Error occurred while retrieving the Micro App for the given app ID!";
    //         log:printError(customError, microApp);
    //         return <http:InternalServerError>{
    //             body: {
    //                 message: customError
    //             }
    //         };
    //     }
    //     if microApp is () {
    //         string customError = "Micro App not found for the given app ID!";
    //         log:printError(customError, appId = appId);
    //         return <http:NotFound>{
    //             body: {
    //                 message: customError
    //             }
    //         };
    //     }

    //     return microApp;
    // }

    // # Retrieves Super App version details for a given platform.
    // #
    // # + ctx - Request context
    // # + platform - Target platform to fetch versions for (android or ios)
    // # + return - A list of database:Version records if successful, or an error on failure
    // resource function get versions(http:RequestContext ctx, string platform)
    //     returns database:Version[]|http:InternalServerError {

    //     authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
    //     if userInfo is error {
    //         return <http:InternalServerError>{
    //             body: {
    //                 message: ERR_MSG_USER_HEADER_NOT_FOUND
    //             }
    //         };
    //     }

    //     database:Version[]|error versions = database:getVersionsByPlatform(platform);
    //     if versions is error {
    //         string customError = "Error occurred while retrieving versions for the given platform!";
    //         log:printError(customError, versions);
    //         return <http:InternalServerError>{
    //             body: {
    //                 message: customError
    //             }
    //         };
    //     }

    //     return versions;
    // }

    // # Fetch the app configurations(downloaded microapps) of the logged in user.
    // #
    // # + ctx - Request context
    // # + return - User configurations or error
    // resource function get users/app\-configs(http:RequestContext ctx)
    //     returns database:AppConfig[]|http:InternalServerError {

    //     authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
    //     if userInfo is error {
    //         return {
    //             body: {
    //                 message: ERR_MSG_USER_HEADER_NOT_FOUND
    //             }
    //         };
    //     }

    //     database:AppConfig[]|error appConfigs = database:getAppConfigsByEmail(userInfo.email);
    //     if appConfigs is error {
    //         string customError = "Error occurred while retrieving app configurations for the user!";
    //         log:printError(customError, appConfigs);
    //         return {
    //             body: {
    //                 message: customError
    //             }
    //         };
    //     }

    //     return appConfigs;
    // }

    // # Add/Update app configurations(downloaded microapps) of the logged in user.
    // #
    // # + ctx - Request context
    // # + configuration - User's app configurations including downloaded microapps
    // # + return - Created response or error
    // resource function post users/app\-configs(http:RequestContext ctx,
    //     database:AppConfig configuration) returns http:Created|http:InternalServerError|http:BadRequest {

    //     authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
    //     if userInfo is error {
    //         return <http:InternalServerError>{
    //             body: {
    //                 message: ERR_MSG_USER_HEADER_NOT_FOUND
    //             }
    //         };
    //     }

    //     if configuration.email != userInfo.email {
    //         string customError = "Token email and the email in the request doesn't match!";
    //         log:printError(customError);
    //         return <http:BadRequest>{
    //             body: {
    //                 message: customError
    //             }
    //         };
    //     }

    //     database:ExecutionSuccessResult|error result =
    //         database:updateAppConfigsByEmail(userInfo.email, configuration);
    //     if result is error {
    //         string customError = "Error occurred while updating the user configuration!";
    //         log:printError(customError, result);
    //         return <http:InternalServerError>{
    //             body: {
    //                 message: customError
    //             }
    //         };
    //     }

    //     return http:CREATED;
    // }
}
