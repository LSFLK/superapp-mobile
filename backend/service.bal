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
import ballerina/io;
// import ballerina/file;
// import superapp_mobile_service.entity;

configurable int maxHeaderSize = 16384; // 16KB header size for WSO2 Choreo support
//configurable string[] restrictedAppsForNonLk = ?;
configurable string lkLocation = "Sri Lanka";
//configurable string mobileAppReviewerEmail = ?; // App store reviewer email

// Mock Employee type matching the original entity:Employee
type MockEmployee record {|
    string workEmail;
    string firstName;
    string lastName;
    string? employeeThumbnail;
    string department;
    string employeeID;
|};

function getMockEmployees() returns MockEmployee[] {
    return [      
        {   
            "workEmail": "john@gov.com",
            "firstName": "John",
            "lastName": "Doe",
            "employeeThumbnail": "https://example.com/avatars/john.jpg",
            "department": "Ministry of Finance",
            "employeeID": "EMP001"
        },
        {
            "workEmail": "jane@gov.com",
            "firstName": "Jane",
            "lastName": "Smith",
            "employeeThumbnail": "https://example.com/avatars/jane.jpg",
            "department": "Ministry of Health",
                        "employeeID": "EMP002"

        },
        {
            "workEmail": "michael@gov.com",
            "firstName": "Michael",
            "lastName": "Brown",
            "employeeThumbnail": null,
            "department": "Ministry of Education",
                        "employeeID": "EMP003"

        },
        {
            "workEmail": "sarah@gov.com",
            "firstName": "Sarah",
            "lastName": "Lee",
            "employeeThumbnail": "https://example.com/avatars/sarah.jpg",
            "department": "Ministry of Transport",
                        "employeeID": "EMP004"

        },
        {
            "workEmail": "mark@gov.com",
            "firstName": "Mark",
            "lastName": "Town",
            "employeeThumbnail": null,
            "department": "Ministry of Defence",
                        "employeeID": "EMP005"

        },
        {
            "workEmail": "mockuser@gov.com",
            "firstName": "Mock",
            "lastName": "User",
            "employeeThumbnail": null,
            "department": "Ministry of Public Administration",
                        "employeeID": "EMP006"
        }
    ];
}

// Mock MicroApp types
type MockMicroAppVersion record {|
    string version;
    int build;
    string releaseNotes;
    string iconUrl;
    string downloadUrl;
|};

type MockMicroApp record {|
    string name;
    string description;
    string promoText;
    string appId;
    string iconUrl;
    string bannerImageUrl;
    int isMandatory; // 0 or 1
    MockMicroAppVersion[] versions; 
|};

function getMockMicroApps() returns MockMicroApp[] {
    return [
        {
            "name": "Payslip Viewer",
            "description": "View and download your monthly payslips",
            "promoText": "Access your payslips anytime, anywhere",
            "appId": "payslip-viewer",
            "iconUrl": "http://localhost:9090/icons/payslip-viewer.png",
            "bannerImageUrl": "http://localhost:9090/banners/payslip-viewer.png",
            "isMandatory": 0,
            "versions": [
                {
                    "version": "1.0.0",
                    "build": 1,
                    "releaseNotes": "Initial release of Payslip Viewer",
                    "iconUrl": "http://localhost:9090/icons/payslip-viewer.png",
                    "downloadUrl": "http://localhost:9090/micro-apps/payslip-viewer/download"
                }
            ]
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

    # + return - ErrorInterceptor
    public function createInterceptors() returns http:Interceptor[] =>
    [new ErrorInterceptor()];

    // Mock user-info endpoint matching the original interface
    # Fetch user information of the logged in users (mock version).
    #
    # + ctx - Request context
    # + email - Email of the user to retrieve (query parameter for mock)
    # + return - User information object or an error
    resource function get user\-info(http:RequestContext ctx, string? email) returns MockEmployee|http:InternalServerError|http:NotFound {
        string userEmail = email ?: "mockuser@gov.com"; // Default to mock user if no email provided
        
        MockEmployee[] employees = getMockEmployees();
        foreach MockEmployee employee in employees {
            if employee.workEmail == userEmail {
                log:printInfo("Found employee: " + employee.toString());
                return employee;
            }
        }
        
        return <http:NotFound>{
            body: { message: "User not found for email: " + userEmail }
        };
    }

    // Get all mock employees (for testing)
    resource function get users/mock(http:RequestContext ctx) returns MockEmployee[] {
        return getMockEmployees();
    }

    // Get a single mock employee by email
    resource function get users/mock/[string email](http:RequestContext ctx) returns MockEmployee|http:NotFound {
        MockEmployee[] employees = getMockEmployees();
        foreach MockEmployee employee in employees {
            if employee.workEmail == email {
                log:printInfo("Found employee: " + employee.toString());
                return employee;
            }
        }
        return <http:NotFound>{
            body: { message: "User not found for email: " + email }
        };
    }

    // Mock micro-apps endpoint
    resource function get micro\-apps(http:RequestContext ctx) returns MockMicroApp[] {
        log:printInfo("Fetching mock micro apps");
        return getMockMicroApps();
    }

    // Mock micro-app by appId endpoint
    resource function get micro\-apps/[string appId](http:RequestContext ctx) returns MockMicroApp|http:NotFound {
        MockMicroApp[] microApps = getMockMicroApps();
        foreach MockMicroApp app in microApps {
            if app.appId == appId {
                log:printInfo("Found micro app: " + app.toString());
                return app;
            }
        }
        return <http:NotFound>{
            body: { message: "Micro app not found for app ID: " + appId }
        };
    }

    // Download microapp zip file
    resource function get micro\-apps/[string appId]/download(http:RequestContext ctx) returns http:Response|http:NotFound|http:InternalServerError {
        string zipFileName = appId + ".zip";
        string zipFilePath = "./microapps_store/" + zipFileName;
        
        log:printInfo("Attempting to download microapp: " + appId);
        log:printInfo("Looking for file: " + zipFilePath);
        
        // Try to read file content to check if it exists
        byte[]|io:Error fileContent = io:fileReadBytes(zipFilePath);
        if fileContent is io:Error {
            log:printError("Zip file not found or error reading: " + zipFilePath, fileContent);
            return <http:NotFound>{
                body: { message: "Microapp zip file not found for app ID: " + appId }
            };
        }
        
        // Create response with zip file
        http:Response response = new;
        response.setBinaryPayload(fileContent);
        error? contentTypeResult = response.setContentType("application/zip");
        if contentTypeResult is error {
            log:printError("Error setting content type", contentTypeResult);
        }
        
        error? headerResult = response.setHeader("Content-Disposition", "attachment; filename=\"" + zipFileName + "\"");
        if headerResult is error {
            log:printError("Error setting header", headerResult);
        }
        
        log:printInfo("Successfully serving zip file: " + zipFileName);
        return response;
    }

    // Serve static icons (placeholder endpoint)
    resource function get icons/[string iconName](http:RequestContext ctx) returns http:Response|http:NotFound {
        // For now, return a placeholder response
        // In a real implementation, you would serve actual icon files
        http:Response response = new;
        response.setTextPayload("Icon placeholder for: " + iconName);
        error? contentTypeResult = response.setContentType("text/plain");
        if contentTypeResult is error {
            log:printError("Error setting content type", contentTypeResult);
        }
        return response;
    }

    // Serve static banners (placeholder endpoint)
    resource function get banners/[string bannerName](http:RequestContext ctx) returns http:Response|http:NotFound {
        // For now, return a placeholder response
        // In a real implementation, you would serve actual banner files
        http:Response response = new;
        response.setTextPayload("Banner placeholder for: " + bannerName);
        error? contentTypeResult = response.setContentType("text/plain");
        if contentTypeResult is error {
            log:printError("Error setting content type", contentTypeResult);
        }
        return response;
    }

    // Original user-info endpoint (commented out - requires JWT authentication)
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
