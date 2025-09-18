import ballerina/http;
import ballerina/log;
import ballerina/jwt;
import ballerina/uuid; // For optional jti claim
//import ballerina/io;
//import ballerina/time;


//////////// DEBUG

// public function main() returns error? {
//     string token_recieved = check createMicroappJWT("EMP004","payslip-viewer");
//     log:printInfo("Token: " + token_recieved);
// }

////////////


// Configurations (add these to your Config.toml or set as environment variables)
configurable string superappIssuer = "superapp-issuer"; 
configurable decimal tokenTTLSeconds = 300; 
configurable string privateKeyPath = ?; 

// Standalone function to create the microapp-specific JWT
// Usage: string|error token = createMicroappJWT("emp-123", "app-456");
public function createMicroappJWT(string empId, string microAppId) returns string|error {
    // Build IssuerConfig for JWT
    jwt:IssuerConfig issuerConfig = {
        issuer: superappIssuer, // Issuer (your superapp backend)
        audience: microAppId, // Audience as a string array for microapp backend
        expTime: tokenTTLSeconds, // Expiry in seconds (relative to iat)
        customClaims: {
            "emp_id": empId, // User emp_id as subject
            "micro_app_id": microAppId, // Custom claim for microapp scoping
            "jti": uuid:createType1AsString() // Unique token ID
        },
        signatureConfig: {
            config: {
                keyFile: privateKeyPath // Path to RS256 private key
            }
        }
    };

    // Issue (sign) the JWT
    string|jwt:Error token = jwt:issue(issuerConfig);
    if token is jwt:Error {
        log:printError("Failed to issue JWT", 'error = token);
        return token;
    }

    log:printInfo("Generated microapp JWT for emp_id: " + empId + ", micro_app_id: " + microAppId);
    return token;
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

service http:InterceptableService / on new http:Listener(serverPort, config = {requestLimits: {maxHeaderSize}}) {

    # + return - ErrorInterceptor
    public function createInterceptors() returns http:Interceptor[] =>
    [new ErrorInterceptor()];


    // Endpoint to generate and return a microapp-specific JWT
    # Generate a microapp-specific JWT based on emp_id and micro_app_id.
    #
    # + ctx - Request context
    # + emp_id - Employee ID (passed as query parameter)
    # + micro_app_id - Microapp ID (passed as query parameter)
    # + return - JSON with JWT or an error
    resource function get micro\-app\-token(http:RequestContext ctx, string emp_id, string micro_app_id) returns json|http:BadRequest|http:InternalServerError {
        // Validate input parameters
        if emp_id.trim() == "" || micro_app_id.trim() == "" {
            log:printError("Missing or empty emp_id or micro_app_id");
            return <http:BadRequest>{
                body: { "error": "Bad Request: emp_id and micro_app_id are required" }
            };
        }

        // Generate the microapp-specific JWT
        string|error token = createMicroappJWT(emp_id, micro_app_id);
        if token is error {
            log:printError("Failed to generate JWT for emp_id this time too: " + emp_id + ", micro_app_id: " + micro_app_id, 'error = token);
            return <http:InternalServerError>{
                body: { "error": "Internal server error" }
            };
        }

        // Return the token in JSON response
        json response = { "token": token , "expiresAt": tokenTTLSeconds};
        log:printInfo("Successfully generated JWT for emp_id: " + emp_id + ", micro_app_id: " + micro_app_id);
        return response;
    }



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

    # Upload a micro-app with ZIP file.
    #
    # + req - HTTP request
    # + return - JSON response or error
    resource function post micro\-apps/upload(http:Request req) returns json|http:BadRequest|http:InternalServerError {
        var bodyParts = req.getBodyParts();
        if bodyParts is error {
            log:printError("Failed to parse multipart body", bodyParts);
            return <http:BadRequest>{
                body: { "error": "Bad Request: Invalid multipart/form-data" }
            };
        }

        string name = "";
        string version = "";
        string appId = "";
        string iconUrlPath = "";
        byte[] zipData = [];

        foreach var part in bodyParts {
            var disposition = part.getContentDisposition();
            string fieldName = disposition.name;
            if fieldName == "zipFile" {
                var byteArray = part.getByteArray();
                if byteArray is error {
                    log:printError("Failed to get byte array for ZIP file", byteArray);
                    return <http:BadRequest>{
                        body: { "error": "Bad Request: Invalid ZIP file" }
                    };
                }
                zipData = byteArray;
            } else if fieldName == "name" {
                var text = part.getText();
                if text is error {
                    log:printError("Failed to get text for name", text);
                    return <http:BadRequest>{
                        body: { "error": "Bad Request: Invalid name" }
                    };
                }
                name = text;
            } else if fieldName == "version" {
                var text = part.getText();
                if text is error {
                    log:printError("Failed to get text for version", text);
                    return <http:BadRequest>{
                        body: { "error": "Bad Request: Invalid version" }
                    };
                }
                version = text;
            } else if fieldName == "appId" {
                var text = part.getText();
                if text is error {
                    log:printError("Failed to get text for appId", text);
                    return <http:BadRequest>{
                        body: { "error": "Bad Request: Invalid appId" }
                    };
                }
                appId = text;
            } else if fieldName == "iconUrlPath" {
                var text = part.getText();
                if text is error {
                    log:printError("Failed to get text for iconUrlPath", text);
                    return <http:BadRequest>{
                        body: { "error": "Bad Request: Invalid iconUrlPath" }
                    };
                }
                iconUrlPath = text;
            }
        }

        if zipData.length() == 0 {
            log:printError("ZIP file not found in request");
            return <http:BadRequest>{
                body: { "error": "Bad Request: ZIP file is required" }
            };
        }

        if name.trim() == "" || version.trim() == "" || appId.trim() == "" {
            return <http:BadRequest>{
                body: { "error": "Bad Request: name, version, and appId are required" }
            };
        }

        error? result = insertMicroAppWithZip(name, version, zipData, appId, iconUrlPath);
        if result is error {
            log:printError("Failed to insert micro-app", result);
            return <http:InternalServerError>{
                body: { "error": "Internal server error" }
            };
        }

        log:printInfo("Micro-app uploaded successfully: " + name);
        return { "message": "Micro-app uploaded successfully" };
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
};

// public function main() returns error? {
//     // Example parameters for insertMicroAppWithZip
//     string name = "Payslip Viewer";
//     string version = "1.0.0";
//     string zipFilePath = "C:/Users/Sandamini/Documents/WORK/payslip-viewer.zip"; // Path to the ZIP file
//     string appId = "payslip-viewer";
//     string iconUrlPath = "";
//     //string description = "View and download your monthly payslips";

//     // Call the insertMicroAppWithZip function
//     check insertMicroAppWithZip(name, version ,zipFilePath, appId, iconUrlPath);
//     io:println("Micro-app insertion completed successfully.");
// }




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