// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file_service to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file_service except
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
import superapp_mobile_service.token_exchange;
import superapp_mobile_service.db_userservice;
import superapp_mobile_service.db_fileservice;

import ballerina/http;
import ballerina/log;

configurable int maxHeaderSize = 16384; // 16KB header size for WSO2 Choreo support
configurable string[] restrictedAppsForNonLk = ?;
configurable string lkLocation = "Sri Lanka";
configurable string mobileAppReviewerEmail = ?; // App store reviewer email
configurable string[] allowedOrigins = ["*"]; // Allowed origins for CORS (comma-separated in production, or "*" for dev)
configurable boolean corsAllowCredentials = false; // Enable CORS credentials

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

listener http:Listener httpListener = new http:Listener(9090, config = {requestLimits: {maxHeaderSize}});

service /\.well\-known on httpListener {

    # Serves the JSON Web Key Set (JWKS) for token verification (public endpoint, no authentication)
    #
    # + return - JWKS response or error
    resource function get jwks() returns token_exchange:JsonWebKeySet|http:InternalServerError {
        token_exchange:JsonWebKeySet|error jwks = token_exchange:getJWKS();
        if jwks is error {
            string customError = "Failed to read JWKS";
            log:printError(customError, jwks);
            return <http:InternalServerError>{
                body: {message: customError}
            };
        }
        
        return jwks;
    }
}

service http:InterceptableService / on httpListener {

    # + return - authorization:JwtInterceptor, ErrorInterceptor
    public function createInterceptors() returns http:Interceptor[] =>
        [new authorization:JwtInterceptor(), new ErrorInterceptor()];

    function init() returns error? {
        log:printInfo("Super app mobile backend started.");
    }

    # Upload file directly in request body
    # Headers: Content-Type
    #
    # + request - HTTP request with binary body
    # + fileName - File name as a query parameter
    # + folderName - Folder name as a query parameter (optional)
    # + return - Upload response with file URL or error
    resource function post files(http:Request request, string fileName, string? folderName = null) 
        returns http:Created|http:InternalServerError {

        byte[]|error content = request.getBinaryPayload();
        if content is error {
            string customError = "Error in reading file content from request body!";
            log:printError(customError, content);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        db_fileservice:ExecutionSuccessResult|error result = db_fileservice:upsertMicroAppFile({fileName: fileName, blobContent: content});
        if result is error {
            string customError = "Error in uploading file to database!";
            log:printError(customError, 'error = result);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        string downloadUrl = db_fileservice:getDownloadUrl(fileName);
        return <http:Created>{
            body: {
                message: db_fileservice:SUCCESS_FILE_UPLOADED,
                downloadUrl: downloadUrl
            }
        };

    }

    # Delete file by name
    # Headers: None
    #
    # + request - HTTP request
    # + fileName - File name as a query parameter
    # + folderName - Folder name as a query parameter (optional)
    # + return - No content or error
    resource function delete files(http:Request request, string fileName, string? folderName = null) 
        returns http:NoContent|http:InternalServerError {

        db_fileservice:ExecutionSuccessResult|error result = db_fileservice:deleteMicroAppFileByName(fileName);
        if result is error {
            string customError = "Error in deleting file from database!";
            log:printError(customError, 'error = result);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return <http:NoContent>{};
    }

    # Download Micro App file by name
    # 
    # + ctx - Request context
    # + fileName - File name as a path parameter
    # + return - byte[] of the MicroAppFile on success or error
    resource function get micro\-app\-files/download/[string fileName](http:RequestContext ctx) 
        returns byte[]|http:InternalServerError|http:NotFound {
        
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: ERR_MSG_USER_HEADER_NOT_FOUND
                }
            };
        }

        byte[]|error? microAppBlobContent = db_fileservice:getMicroAppBlobContentByName(fileName);
        if microAppBlobContent is error {
            string customError = "Error occurred while retrieving Micro App file for the given file name!";
            log:printError(customError, microAppBlobContent);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if microAppBlobContent is () {
            string customError = "Micro App file not found for the given file name!";
            log:printError(customError, fileName = fileName);
            return <http:NotFound>{
                body: {
                    message: customError
                }
            };
        }

        return microAppBlobContent;
    }

    # Fetch user information of the logged in users.
    #
    # + ctx - Request context
    # + return - User information object or an error
    resource function get user\-info(http:RequestContext ctx) returns db_userservice:User|http:InternalServerError|http:NotFound {
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: ERR_MSG_USER_HEADER_NOT_FOUND
                }
            };
        }

        db_userservice:User|error? loggedInUser = getUserInfo(userInfo.email);
        if loggedInUser is error {
            string customError = "Error occurred while retrieving user data!";
            log:printError(customError, loggedInUser);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if loggedInUser is () {
            log:printWarn("User not found!", email = userInfo.email);
            return http:NOT_FOUND;
        }

        error? cacheError = userInfoCache.put(userInfo.email, loggedInUser);
        if cacheError is error {
            log:printError("Error in updating the user cache!", cacheError);
        }

        return loggedInUser;
    }
    
    # Retrieves the list of micro apps available to the authenticated user.
    #
    # + ctx - Request context
    # + return - A list of microapps if successful, or an error on failure
    resource function get micro\-apps(http:RequestContext ctx) returns database:MicroApp[]|http:InternalServerError {
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: ERR_MSG_USER_HEADER_NOT_FOUND
                }
            };
        }

        database:MicroApp[]|error allMicroApps = database:getMicroApps(userInfo.groups ?: []);
        if allMicroApps is error {
            string customError = "Error occurred while retrieving Micro Apps!";
            log:printError(customError, err = allMicroApps.message());
            return {
                body: {
                    message: customError
                }
            };
        }

        // Bypass the filtering for the app store reviewer
        if userInfo.email == mobileAppReviewerEmail {
            return allMicroApps;
        }

        database:User|error? loggedInUser = getUserInfo(userInfo.email);
        if loggedInUser is error {
            string customError = "Error occurred while retrieving user data!";
            log:printError(customError, loggedInUser);
            return {
                body: {
                    message: customError
                }
            };
        }

        database:MicroApp[] filteredMicroApps = allMicroApps;

        if loggedInUser is database:User && loggedInUser.location != lkLocation {
            filteredMicroApps = allMicroApps.filter(microapp => restrictedAppsForNonLk.indexOf(microapp.appId) is ());
        }

        return filteredMicroApps;
    }

    # Retrieves details of a specific micro app based on its App ID.
    #
    # + ctx - Request context
    # + appId - ID of the micro app to retrieve
    # + return - Single microapp, or errors on failure and not found
    resource function get micro\-apps/[string appId](http:RequestContext ctx)
        returns database:MicroApp|http:InternalServerError|http:NotFound {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: ERR_MSG_USER_HEADER_NOT_FOUND
                }
            };
        }

        database:MicroApp|error? microApp = database:getMicroAppById(appId, userInfo.groups ?: []);

        if microApp is error {
            string customError = "Error occurred while retrieving the Micro App for the given app ID!";
            log:printError(customError, microApp);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }
        if microApp is () {
            string customError = "Micro App not found for the given app ID!";
            log:printError(customError, appId = appId);
            return <http:NotFound>{
                body: {
                    message: customError
                }
            };
        }

        return microApp;
    }

    # Create or update a MicroApp along with provided versions and roles.
    #
    # + ctx - Request context
    # + microApp - MicroApp payload to create/update
    # + return - `http:Created` on success or errors on failure
    resource function post micro\-apps(http:RequestContext ctx, database:MicroApp microApp)
        returns http:Created|http:InternalServerError|http:BadRequest {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {message: ERR_MSG_USER_HEADER_NOT_FOUND}
            };
        }
        
        database:ExecutionSuccessResult|error result = database:upsertMicroApp(microApp, userInfo.email);
        if result is error {
            string customError = "Error occurred while upserting Micro App!";
            log:printError(customError, result);
            return <http:InternalServerError>{body: {message: customError}};
        }
        
        return http:CREATED;
    }

    # Add a new version to an existing MicroApp.
    #
    # + ctx - Request context
    # + appId - MicroApp ID to which the version belongs
    # + version - MicroAppVersion payload to create/update
    # + return - `http:Created` on success or errors on failure
    resource function post micro\-apps/[string appId]/versions(http:RequestContext ctx, 
        database:MicroAppVersion version) returns http:Created|http:InternalServerError|http:BadRequest {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {message: ERR_MSG_USER_HEADER_NOT_FOUND}
            };
        }
        
        database:ExecutionSuccessResult|error result = database:upsertMicroAppVersion(appId, version, userInfo.email);
        if result is error {
            string customError = "Error occurred while upserting Micro App version!";
            log:printError(customError, result);
            return <http:InternalServerError>{body: {message: customError}};
        }
        
        return http:CREATED;
    }

    # Add a role mapping to an existing MicroApp.
    #
    # + ctx - Request context
    # + appId - MicroApp ID to which the role mapping belongs
    # + appRole - MicroAppRole payload containing the role name
    # + return - `http:Created` on success or errors on failure
    resource function post micro\-apps/[string appId]/roles(http:RequestContext ctx, database:MicroAppRole appRole) 
        returns http:Created|http:InternalServerError|http:BadRequest {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {message: ERR_MSG_USER_HEADER_NOT_FOUND}
            };
        }
        
        database:ExecutionSuccessResult|error result = database:upsertMicroAppRole(appId, appRole, userInfo.email);
        if result is error {
            string customError = "Error occurred while upserting role mapping to Micro App!";
            log:printError(customError, result);
            return <http:InternalServerError>{body: {message: customError}};
        }
        
        return http:CREATED;
    }

    # Deactivate a MicroApp by setting it inactive along with its versions and roles.
    #
    # + ctx - Request context
    # + appId - MicroApp ID to delete
    # + return - `http:Ok` on success or errors on failure
    resource function put micro\-apps/deactivate/[string appId](http:RequestContext ctx)
        returns http:Ok|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {message: ERR_MSG_USER_HEADER_NOT_FOUND}
            };
        }
        
        database:ExecutionSuccessResult|error result = database:deactivateMicroApp(appId, userInfo.email);
        if result is error {
            string customError = "Error occurred while deactivating Micro App!";
            log:printError(customError, result);
            return <http:InternalServerError>{body: {message: customError}};
        }
        
        return <http:Ok>{body: {message: result}};
    }

    # Retrieves Super App version details for a given platform.
    #
    # + ctx - Request context
    # + platform - Target platform to fetch versions for (android or ios)
    # + return - A list of database:Version records if successful, or an error on failure
    resource function get versions(http:RequestContext ctx, string platform)
        returns database:Version[]|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: ERR_MSG_USER_HEADER_NOT_FOUND
                }
            };
        }

        database:Version[]|error versions = database:getVersionsByPlatform(platform);
        if versions is error {
            string customError = "Error occurred while retrieving versions for the given platform!";
            log:printError(customError, versions);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return versions;
    }

    # Fetch the app configurations(downloaded microapps) of the logged in user.
    #
    # + ctx - Request context
    # + return - User configurations or error
    resource function get users/app\-configs(http:RequestContext ctx)
        returns database:AppConfig[]|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return {
                body: {
                    message: ERR_MSG_USER_HEADER_NOT_FOUND
                }
            };
        }

        database:AppConfig[]|error appConfigs = database:getAppConfigsByEmail(userInfo.email);
        if appConfigs is error {
            string customError = "Error occurred while retrieving app configurations for the user!";
            log:printError(customError, appConfigs);
            return {
                body: {
                    message: customError
                }
            };
        }

        return appConfigs;
    }

    # Add/Update app configurations(downloaded microapps) of the logged in user.
    #
    # + ctx - Request context
    # + configuration - User's app configurations including downloaded microapps
    # + return - Created response or error
    resource function post users/app\-configs(http:RequestContext ctx,
        database:AppConfig configuration) returns http:Created|http:InternalServerError|http:BadRequest {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: ERR_MSG_USER_HEADER_NOT_FOUND
                }
            };
        }

        if configuration.email != userInfo.email {
            string customError = "Token email and the email in the request doesn't match!";
            log:printError(customError);
            return <http:BadRequest>{
                body: {
                    message: customError
                }
            };
        }

        database:ExecutionSuccessResult|error result =
            database:updateAppConfigsByEmail(userInfo.email, configuration);
        if result is error {
            string customError = "Error occurred while updating the user configuration!";
            log:printError(customError, result);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return http:CREATED;
    }

    # Insert or update user information in the database (single or bulk).
    #
    # + ctx - Request context
    # + payload - User or BulkUserRequest containing users to insert/update
    # + return - `http:Created` on success or errors on failure
    resource function post users(http:RequestContext ctx, db_userservice:User|db_userservice:User[] payload) 
        returns http:Created|http:InternalServerError|http:BadRequest {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {message: ERR_MSG_USER_HEADER_NOT_FOUND}
            };
        }

        error? result;
        if payload is db_userservice:User[] {
            result = db_userservice:upsertBulkUsersInfo(payload);
        } else {
            result = db_userservice:upsertUserInfo(payload);
        }
        
        if result is error {
            string customError = "Error occurred while creating/updating user information!";
            log:printError(customError, result);
            return <http:InternalServerError>{
                body: {message: customError}
            };
        }

        return http:CREATED;
    }

    # Get all users.
    #
    # + ctx - Request context
    # + return - Array of users or errors on failure
    resource function get users(http:RequestContext ctx) returns db_userservice:User[]|http:InternalServerError|http:NoContent {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {message: ERR_MSG_USER_HEADER_NOT_FOUND}
            };
        }

       db_userservice:User[]|error? users = db_userservice:getAllUsers();

        if users is () {
            return http:NO_CONTENT;
        }
        
        if users is error {
            string customError = "Error occurred while fetching users!";
            log:printError(customError, users);
            return <http:InternalServerError>{
                body: {message: customError}
            };
        }
        
        return users;
    }

    # Delete a user.
    #
    # + ctx - Request context
    # + email - User's email address to delete
    # + return - `http:NoContent` on success or errors on failure
    resource function delete users/[string email](http:RequestContext ctx) 
        returns http:NoContent|http:InternalServerError|http:NotFound {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {message: ERR_MSG_USER_HEADER_NOT_FOUND}
            };
        }

        error? result = db_userservice:deleteUser(email);
        
        if result is error {
            string errorMsg = result.message();
            if errorMsg.includes("not found") {
                return <http:NotFound>{
                    body: {message: "User not found"}
                };
            }

            string customError = "Error occurred while deleting user!";
            log:printError(customError, result);
            return <http:InternalServerError>{
                body: {message: customError}
            };
        }

        error? cacheError = userInfoCache.invalidate(email);
        if cacheError is error {
            log:printError("Error in invalidating the user cache!", cacheError);
        }
        
        return http:NO_CONTENT;
    }

    # Request a JWT for authorization.
    #
    # + ctx - Request context
    # + request - Token request payload
    # + return - `TokenResponse` with the generated JWT token on success, or errors on failure
    resource function post tokens(http:RequestContext ctx, token_exchange:TokenRequest request)
        returns string|http:InternalServerError|http:BadRequest {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {message: ERR_MSG_USER_HEADER_NOT_FOUND}
            };
        }

        string|error token = token_exchange:issueJWT(userInfo.email, request.microAppId);
        if token is error {
            string customError = "Error occurred while generating JWT token";
            log:printError(customError, token);
            return <http:InternalServerError>{
                body: {message: customError}
            };
        }

        return token;
    }
}
