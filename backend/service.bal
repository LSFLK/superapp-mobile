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
import superapp_mobile_service.authorization;
import superapp_mobile_service.database;
import superapp_mobile_service.entity;

import ballerina/http;
import ballerina/log;

configurable int maxHeaderSize = 16384;
configurable string[] appsToRemoveNonLk = ?;
configurable string Lklocation = ?;
configurable string mobileAppReviewerEmail = ?;

@display {
    label: "SuperApp Mobile Service",
    id: "wso2-open-operations/superapp-mobile-service"
}

service class ErrorInterceptor {
    *http:ResponseErrorInterceptor;

    remote function interceptResponseError(error err, http:RequestContext ctx) returns http:BadRequest|error {

        // Handle data-binding errors.
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

service http:InterceptableService / on new http:Listener(9090,
    config = {
        requestLimits: {
            maxHeaderSize
        }
    }
) {

    # + return - authorization:JwtInterceptor, ErrorInterceptor
    public function createInterceptors() returns http:Interceptor[] =>
        [new authorization:JwtInterceptor(), new ErrorInterceptor()];

    # Retrieves the list of micro apps available to the authenticated user.
    #
    # + ctx - Request context
    # + return - A list of microapps if successful, or an error on failure
    resource function get microapps(http:RequestContext ctx) returns database:MicroApp[]|SuperAppServerError {
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return {
                body: {
                    message: ERR_MSG_USER_HEADER_NOT_FOUND
                }
            };
        }

        database:MicroApp[]|error allMicroApps = database:getAllMicroApps(userInfo.groups);
        if allMicroApps is error {
            string customError = "Error occurred while retrieving MicroApps";
            log:printError(customError, err = allMicroApps.message());
            return {
                body: {
                    message: customError
                }
            };
        }

        // Bypass the filtering for the mobile app reviewer
        if userInfo.email == mobileAppReviewerEmail {
            return allMicroApps;
        }

        entity:Employee|error? loggedInUser = getUserInfo(userInfo.email);
        if loggedInUser is error {
            string customError = string `Error occurred while retrieving user data: ${userInfo.email}!`;
            log:printError(customError, loggedInUser);
            return {
                body: {
                    message: customError
                }
            };
        }

        database:MicroApp[] filteredMicroApps = allMicroApps;

        if loggedInUser is entity:Employee && loggedInUser.location != Lklocation {
            filteredMicroApps = allMicroApps.filter(microapp => appsToRemoveNonLk.indexOf(microapp.appId) is ());
        }

        return filteredMicroApps;
    }

    # Retrieves details of a specific micro app based on its App ID.
    #
    # + ctx - Request context
    # + appId - ID of the micro app to retrieve
    # + return - Single microapp, or errors on failure and not found
    resource function get microapps/[string appId](http:RequestContext ctx)
        returns database:MicroApp|SuperAppServerError|SuperAppNotFoundError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <SuperAppServerError>{
                body: {
                    message: ERR_MSG_USER_HEADER_NOT_FOUND
                }
            };
        }

        database:MicroApp?|error microApp = database:getMicroAppById(appId, userInfo.groups);

        if microApp is error {
            string customError = "Error occurred while retrieving the MicroApp for the given App ID";
            log:printError(customError, microApp);
            return <SuperAppServerError>{
                body: {
                    message: customError
                }
            };
        }
        if microApp is () {
            string customError = "MicroApp not found for the given App ID";
            log:printError(customError, appId = appId);
            return <SuperAppNotFoundError>{
                body: {
                    message: customError
                }
            };
        }

        return microApp;
    }

    # Retrieves Super App version details for a given platform.
    #
    # + ctx - Request context
    # + platform - Target platform to fetch versions for (android or ios)
    # + return - A list of database:SuperAppVersion records if successful, or an error on failure
    resource function get superapp\-versions(http:RequestContext ctx, string platform)
        returns database:SuperAppVersion[]|SuperAppServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <SuperAppServerError>{
                body: {
                    message: ERR_MSG_USER_HEADER_NOT_FOUND
                }
            };
        }

        database:SuperAppVersion[]|error superAppVersions = database:getSuperAppVersionsByPlatform(platform);
        if superAppVersions is error {
            string customError = "Error occurred while retrieving SuperApp versions for the given platform";
            log:printError(customError, superAppVersions);
            return <SuperAppServerError>{
                body: {
                    message: customError
                }
            };
        }

        return superAppVersions;
    }

    # Fetch user configurations(downloaded microapps) of the logged in user.
    #
    # + ctx - Request context
    # + return - User configurations or error
    resource function get user\-configurations(http:RequestContext ctx)
        returns database:UserConfiguration[]|SuperAppServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return {
                body: {
                    message: ERR_MSG_USER_HEADER_NOT_FOUND
                }
            };
        }

        database:UserConfiguration[]|error userConfigurations = database:getUserConfigurationsByEmail(userInfo.email);
        if userConfigurations is error {
            string customError = "Error occurred while retrieving configurations for the user";
            log:printError(customError, userConfigurations);
            return {
                body: {
                    message: customError
                }
            };
        }
        if userConfigurations.length() == 0 {
            string customError = "User configurations not found for the user";
            log:printError(customError, email = userInfo.email);
            return {
                body: {
                    message: customError
                }
            };
        }

        return userConfigurations;
    }

    # Add/Update user configurations(downloaded microapps) of the logged in user.
    #
    # + ctx - Request context
    # + configuration - User configurations including downloaded microapps
    # + return - Success response for the Database create/update or error
    resource function post user\-configurations(http:RequestContext ctx,
        database:UserConfiguration configuration) returns database:ExecutionSuccessResult|SuperAppServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return {
                body: {
                    message: ERR_MSG_USER_HEADER_NOT_FOUND
                }
            };
        }

        if configuration.email != userInfo.email {
            string customError = "Token email and the email in the request doesn't match";
            log:printError(customError, email = userInfo.email, configurationEmail = configuration.email);
            return {
                body: {
                    message: customError
                }
            };
        }

        database:ExecutionSuccessResult|error result =
            database:updateUserConfigurationByEmail(userInfo.email, configuration);
        if result is error {
            string customError = "Error occurred while updating the user configuration";
            log:printError(customError, result);
            return {
                body: {
                    message: customError
                }
            };
        }

        return result;
    }

    # Fetch user information of the logged in users.
    #
    # + ctx - Request context
    # + return - User information object or an error
    resource function get user\-info(http:RequestContext ctx) returns entity:Employee|SuperAppServerError {
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return {
                body: {
                    message: ERR_MSG_USER_HEADER_NOT_FOUND
                }
            };
        }

        entity:Employee|error loggedInUser = getUserInfo(userInfo.email);
        if loggedInUser is error {
            string customError = string `Error occurred while retrieving user data: ${userInfo.email}!`;
            log:printError(customError, loggedInUser);
            return {
                body: {
                    message: customError
                }
            };
        }

        error? cacheError = userInfoCache.put(userInfo.email, loggedInUser);
        if cacheError is error {
            log:printError(string `Error in updating the user cache for: ${userInfo.email}!`, cacheError);
        }

        return loggedInUser;
    }
}
