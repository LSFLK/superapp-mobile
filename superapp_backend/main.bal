import ballerina/http;
import ballerina/log;
//import ballerina/io;

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

service http:InterceptableService / on new http:Listener(serverPort, config = {requestLimits: {maxHeaderSize}}) {

    # + return - ErrorInterceptor
    public function createInterceptors() returns http:Interceptor[] =>
    [new ErrorInterceptor()];


    // Endpoint to retrieve all users from the database
    # Fetch all users from the database.
    #
    # + ctx - Request context
    # + return - Array of User records or an error
    resource function get users(http:RequestContext ctx) returns User[]|http:InternalServerError {
        User[]|error result = fetchAllUsers();
        if result is error {
            log:printError("Error fetching users from database", result);
            return <http:InternalServerError>{
                body: { message: "Failed to fetch users from database" }
            };
        }
        log:printInfo("Successfully fetched " + result.length().toString() + " users");
        return result;
    }


    # Fetch a user by email from the database.
    #
    # + ctx - Request context
    # + email - Email of the user to retrieve
    # + return - User record or an error
    resource function get users/[string email](http:RequestContext ctx) returns User|http:NotFound|http:InternalServerError {
        User|error result = fetchUserByEmail(email);
        if result is error {
            log:printError("Error fetching user with email: " + email, result);
            if result.message().startsWith("No user found") {
                return <http:NotFound>{
                    body: { message: "User not found for email: " + email }
                };
            }
            return <http:InternalServerError>{
                body: { message: "Failed to fetch user from database" }
            };
        }
        log:printInfo("Successfully fetched user with email: " + email);
        return result;
    }


    // Endpoint to retrieve all micro-apps from the database
    # Fetch all micro-apps from the database.
    #
    # + ctx - Request context
    # + return - Array of MicroApp records or an error
    resource function get micro\-apps(http:RequestContext ctx) returns MicroApp[]|http:InternalServerError {
        MicroApp[]|error result = fetchAllMicroApps();
        if result is error {
            log:printError("Error fetching micro-apps from database", result);
            return <http:InternalServerError>{
                body: { message: "Failed to fetch micro-apps from database" }
            };
        }
        log:printInfo("Successfully fetched " + result.length().toString() + " micro-apps");
        return result;
    }

    
    // Endpoint to retrieve a specific micro-app by its app ID from the database
    # Fetch a micro-app by its app ID from the database.
    #
    # + ctx - Request context
    # + appId - App ID of the micro-app to retrieve
    # + return - MicroApp record or an error
    resource function get micro\-apps/[string appId](http:RequestContext ctx) returns MicroApp|http:NotFound|http:InternalServerError {
        MicroApp|error result = fetchMicroAppById(appId);
        if result is error {
            log:printError("Error fetching micro-app with app ID: " + appId, result);
            if result.message().startsWith("No micro-app found") {
                return <http:NotFound>{
                    body: { message: "Micro-app not found for app ID: " + appId }
                };
            }
            return <http:InternalServerError>{
                body: { message: "Failed to fetch micro-app from database" }
            };
        }
        log:printInfo("Successfully fetched micro-app with app ID: " + appId);
        return result;
    }


    # Download the ZIP file for a micro-app by its app ID from the database.
    #
    # + ctx - Request context
    # + appId - App ID of the micro-app to download
    # + return - HTTP response with ZIP file or an error
    resource function get micro\-apps/[string appId]/download(http:RequestContext ctx) returns http:Response|http:NotFound|http:InternalServerError {
        log:printInfo("Attempting to download micro-app ZIP with app ID: " + appId);
        
        MicroAppDownload|error result = fetchMicroAppZipById(appId);
        if result is error {
            log:printError("Error fetching ZIP for micro-app with app ID: " + appId, result);
            if result.message().startsWith("No micro-app ZIP found") {
                return <http:NotFound>{
                    body: { message: "Micro-app ZIP file not found for app ID: " + appId }
                };
            }
            return <http:InternalServerError>{
                body: { message: "Failed to fetch micro-app ZIP from database" }
            };
        }
        
        http:Response response = new;
        response.setBinaryPayload(result.zip_blob);
        error? contentTypeResult = response.setContentType("application/zip");
        if contentTypeResult is error {
            log:printError("Error setting content type", contentTypeResult);
        }
        
        error? headerResult = response.setHeader("Content-Disposition", "attachment; filename=\"" + appId + ".zip\"");
        if headerResult is error {
            log:printError("Error setting header", headerResult);
        }
        
        log:printInfo("Successfully serving ZIP file for micro-app: " + appId);
        return response;
    }


    # Fetch the icon for a micro-app by its app ID from the database.
    #
    # + ctx - Request context
    # + iconName - App ID of the micro-app (used as iconName for compatibility)
    # + return - HTTP response with icon image or an error
    resource function get icons/[string iconName](http:RequestContext ctx) returns http:Response|http:NotFound|http:InternalServerError {
        log:printInfo("Attempting to fetch icon for micro-app with app ID: " + iconName);
        
        MicroAppIcon|error result = fetchMicroAppIconById(iconName);
        if result is error {
            log:printError("Error fetching icon for micro-app with app ID: " + iconName, result);
            if result.message().startsWith("No icon found") {
                return <http:NotFound>{
                    body: { message: "Icon not found for micro-app with app ID: " + iconName }
                };
            }
            return <http:InternalServerError>{
                body: { message: "Failed to fetch icon from database" }
            };
        }
        
        http:Response response = new;
        response.setBinaryPayload(result.icon_url);
        
        // Determine content type based on iconName extension
        string contentType = "image/png"; // Default to PNG
        if iconName.endsWith(".jpg") || iconName.endsWith(".jpeg") {
            contentType = "image/jpeg";
        }
        error? contentTypeResult = response.setContentType(contentType);
        if contentTypeResult is error {
            log:printError("Error setting content type", contentTypeResult);
        }
        
        error? headerResult = response.setHeader("Content-Disposition", "inline; filename=\"" + iconName + "\"");
        if headerResult is error {
            log:printError("Error setting header", headerResult);
        }
        
        log:printInfo("Successfully serving icon for micro-app: " + iconName);
        return response;
    }
}







    // # Fetch user information of the logged in users (mock version).
    // #
    // # + ctx - Request context
    // # + email - Email of the user to retrieve (query parameter for mock)
    // # + return - User information object or an error
    // resource function get user\-info(http:RequestContext ctx, string? email) returns MockEmployee|http:InternalServerError|http:NotFound {
    //     string userEmail = email ?: "mockuser@gov.com"; // Default to mock user if no email provided
        
    //     // MockEmployee[] employees = getMockEmployees();
    //     // foreach MockEmployee employee in employees {
    //     //     if employee.workEmail == userEmail {
    //     //         log:printInfo("Found employee: " + employee.toString());
    //     //         return employee;
    //     //     }
    //     // }
        
    //     return <http:NotFound>{
    //         body: { message: "User not found for email: " + userEmail }
    //     };
    // }


    // Get a single mock employee by email
    // resource function get users/mock/[string email](http:RequestContext ctx) returns MockEmployee|http:NotFound {
    //     MockEmployee[] employees = getMockEmployees();
    //     foreach MockEmployee employee in employees {
    //         if employee.workEmail == email {
    //             log:printInfo("Found employee: " + employee.toString());
    //             return employee;
    //         }
    //     }
    //     return <http:NotFound>{
    //         body: { message: "User not found for email: " + email }
    //     };
    // }


    // // Mock micro-apps endpoint
    // resource function get micro\-apps(http:RequestContext ctx) returns MockMicroApp[] {
    //     log:printInfo("Fetching mock micro apps");
    //     return getMockMicroApps();
    // }


    // // Mock micro-app by appId endpoint
    // resource function get micro\-apps/[string appId](http:RequestContext ctx) returns MockMicroApp|http:NotFound {
    //     MockMicroApp[] microApps = getMockMicroApps();
    //     foreach MockMicroApp app in microApps {
    //         if app.appId == appId {
    //             log:printInfo("Found micro app: " + app.toString());
    //             return app;
    //         }
    //     }
    //     return <http:NotFound>{
    //         body: { message: "Micro app not found for app ID: " + appId }
    //     };
    // }


    // Download microapp zip file
    // resource function get micro\-apps/[string appId]/download(http:RequestContext ctx) returns http:Response|http:NotFound|http:InternalServerError {
    //     string zipFileName = appId + ".zip";
    //     string zipFilePath = "./microapps_store/" + zipFileName;
        
    //     log:printInfo("Attempting to download microapp: " + appId);
    //     log:printInfo("Looking for file: " + zipFilePath);
        
    //     // Try to read file content to check if it exists
    //     byte[]|io:Error fileContent = io:fileReadBytes(zipFilePath);
    //     if fileContent is io:Error {
    //         log:printError("Zip file not found or error reading: " + zipFilePath, fileContent);
    //         return <http:NotFound>{
    //             body: { message: "Microapp zip file not found for app ID: " + appId }
    //         };
    //     }
        
    //     // Create response with zip file
    //     http:Response response = new;
    //     response.setBinaryPayload(fileContent);
    //     error? contentTypeResult = response.setContentType("application/zip");
    //     if contentTypeResult is error {
    //         log:printError("Error setting content type", contentTypeResult);
    //     }
        
    //     error? headerResult = response.setHeader("Content-Disposition", "attachment; filename=\"" + zipFileName + "\"");
    //     if headerResult is error {
    //         log:printError("Error setting header", headerResult);
    //     }
        
    //     log:printInfo("Successfully serving zip file: " + zipFileName);
    //     return response;
    // }


    // Serve static icons (placeholder endpoint)
    // resource function get icons/[string iconName](http:RequestContext ctx) returns http:Response|http:NotFound {
    //     // For now, return a placeholder response
    //     // In a real implementation, you would serve actual icon files
    //     http:Response response = new;
    //     response.setTextPayload("Icon placeholder for: " + iconName);
    //     error? contentTypeResult = response.setContentType("text/plain");
    //     if contentTypeResult is error {
    //         log:printError("Error setting content type", contentTypeResult);
    //     }
    //     return response;
    // }


    // Serve static banners (placeholder endpoint)
    // resource function get banners/[string bannerName](http:RequestContext ctx) returns http:Response|http:NotFound {
    //     // For now, return a placeholder response
    //     // In a real implementation, you would serve actual banner files
    //     http:Response response = new;
    //     response.setTextPayload("Banner placeholder for: " + bannerName);
    //     error? contentTypeResult = response.setContentType("text/plain");
    //     if contentTypeResult is error {
    //         log:printError("Error setting content type", contentTypeResult);
    //     }
    //     return response;
    // }




    

// function getMockMicroApps() returns MockMicroApp[] {
//     return [
//         {
//             "name": "Payslip Viewer",
//             "description": "View and download your monthly payslips",
//             "promoText": "Access your payslips anytime, anywhere",
//             "appId": "payslip-viewer",
//             "iconUrl": "http://localhost:9090/icons/payslip-viewer.png",
//             "bannerImageUrl": "http://localhost:9090/banners/payslip-viewer.png",
//             "isMandatory": 0,
//             "versions": [
//                 {
//                     "version": "1.0.0",
//                     "build": 1,
//                     "releaseNotes": "Initial release of Payslip Viewer",
//                     "iconUrl": "http://localhost:9090/icons/payslip-viewer.png",
//                     "downloadUrl": "http://localhost:9090/micro-apps/payslip-viewer/download"
//                 }
//             ]
//         }
//     ];
// }


// public function main() returns error? {
//     // fetch all users
//     //fetchAllUsers();

//     string targetEmail = "sarah@gov.com";

//     User user = check fetchUserByEmail(targetEmail);
//     log:printInfo("User found: " + user.first_name + " " + user.last_name);

//     // Fetch all micro-apps
//    // check fetchAllMicroApps();

//     // Fetch a specific micro-app by ID
//     string targetId = "payslip-viewer";
//     MicroApp app = check fetchMicroAppById(targetId);
//     log:printInfo(
//         "MicroApp by ID: " + app.name + 
//         " | App ID: " + app.app_id + 
//         " | Version: " + app.version
//     );

    // Insert Payslip Viewer micro-app
    // string zipPath = "C:/Users/Sandamini/Documents/Microapps/payslip-viewer.zip";
    // check insertMicroAppWithZip("Payslip Viewer", "1.0.0", zipPath, "payslip-viewer");
// }

// Mock MicroApp types
// type MockMicroAppVersion record {|
//     string version;
//     int build;
//     string releaseNotes;
//     string iconUrl;
//     string downloadUrl;
// |};

// type MockMicroApp record {|
//     string name;
//     string description;
//     string promoText;
//     string appId;
//     string iconUrl;
//     string bannerImageUrl;
//     int isMandatory; // 0 or 1
//     MockMicroAppVersion[] versions; 
// |};