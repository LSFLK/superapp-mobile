import ballerina/http;
import ballerina/io;
import ballerina/lang.runtime;
import ballerina/log;

function init() {
    io:println("Initializing the superapp backend service...");

    // Registers a function that will be called during the graceful shutdown.
    runtime:onGracefulStop(stopHandler);
}

isolated service class ErrorInterceptor {
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

// CORS configuration for frontend access
@http:ServiceConfig {
    cors: {
        allowOrigins: ["*"],
        allowCredentials: false,
        allowHeaders: ["Authorization", "Content-Type", "x-jwt-assertion"],
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    }
}
isolated service http:InterceptableService / on new http:Listener(serverPort, config = {requestLimits: {maxHeaderSize}}) {

    # + return - ErrorInterceptor
    public function createInterceptors() returns http:Interceptor[] =>
    //[new ErrorInterceptor()];
    [
        new ErrorInterceptor(),
        new JwtInterceptor()
    ];

    #
    # + ctx - Request context
    # + emp_id - Employee ID (passed as query parameter)
    # + micro_app_id - Microapp ID (passed as query parameter)
    # + return - JSON with JWT or an error
    isolated resource function get micro\-app\-token(http:RequestContext ctx, string emp_id, string micro_app_id) returns json|http:BadRequest|http:InternalServerError {
        // Validate input parameters
        if emp_id.trim() == "" || micro_app_id.trim() == "" {
            log:printError("Missing or empty emp_id or micro_app_id");
            return <http:BadRequest>{
                body: {"error": "Bad Request: emp_id and micro_app_id are required"}
            };
        }

        // Generate the microapp-specific JWT
        string|error token = createMicroappJWT(emp_id, micro_app_id);
        if token is error {
            log:printError("Failed to generate JWT for emp_id this time too: " + emp_id + ", micro_app_id: " + micro_app_id, 'error = token);
            return <http:InternalServerError>{
                body: {"error": "Internal server error"}
            };
        }

        // Return the token in JSON response
        json response = {"token": token, "expiresAt": tokenTTLSeconds};
        log:printInfo("Successfully generated JWT for emp_id: " + emp_id + ", micro_app_id: " + micro_app_id);
        return response;
    }

    # Updates the downloaded app IDs for a user.
    #
    # + ctx - Request context
    # + req - HTTP request containing the payload
    # + return - JSON response or an error
    isolated resource function post users/[string email]/apps(http:RequestContext ctx, http:Request req) returns json|http:BadRequest|http:InternalServerError|http:ClientError {

        json payload = check req.getJsonPayload();

        // Call the existing function
        error? result = updateUserDownloadedApps(email, payload);
        if result is error {
            log:printError("Failed to update downloaded apps for email: " + email, 'error = result);
            return <http:InternalServerError>{
                body: {"error": "Internal server error"}
            };
        }

        // Send success response
        json response = {"status": "success", "message": "Downloaded apps updated successfully"};
        log:printInfo("Successfully updated downloaded apps for email: " + email);
        return response;
    }

    # Fetch a user by email from the database.
    #
    # + ctx - Request context
    # + email - Email of the user to retrieve
    # + return - User record or an error
    isolated resource function get users/[string email](http:RequestContext ctx) returns User|http:NotFound|http:InternalServerError {
        User|error result = fetchUserByEmail(email);
        if result is error {
            log:printError("Error fetching user with email: " + email, result);
            if result.message().startsWith("No user found") {
                return <http:NotFound>{
                    body: {message: "User not found for email: " + email}
                };
            }
            return <http:InternalServerError>{
                body: {message: "Failed to fetch user from database"}
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
    isolated resource function get micro\-apps(http:RequestContext ctx) returns MicroApp[]|http:InternalServerError {
        MicroApp[]|error result = fetchAllMicroApps();
        if result is error {
            log:printError("Error fetching micro-apps from database", result);
            return <http:InternalServerError>{
                body: {message: "Failed to fetch micro-apps from database"}
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
    isolated resource function get micro\-apps/[string appId](http:RequestContext ctx) returns MicroApp|http:NotFound|http:InternalServerError {
        MicroApp|error result = fetchMicroAppById(appId);
        if result is error {
            log:printError("Error fetching micro-app with app ID: " + appId, result);
            if result.message().startsWith("No micro-app found") {
                return <http:NotFound>{
                    body: {message: "Micro-app not found for app ID: " + appId}
                };
            }
            return <http:InternalServerError>{
                body: {message: "Failed to fetch micro-app from database"}
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
    isolated resource function get micro\-apps/[string appId]/download(http:RequestContext ctx) returns http:Response|http:NotFound|http:InternalServerError {
        log:printInfo("Attempting to download micro-app ZIP with app ID: " + appId);

        MicroAppDownload|error result = fetchMicroAppZipById(appId);
        if result is error {
            log:printError("Error fetching ZIP for micro-app with app ID: " + appId, result);
            if result.message().startsWith("No micro-app ZIP found") {
                return <http:NotFound>{
                    body: {message: "Micro-app ZIP file not found for app ID: " + appId}
                };
            }
            return <http:InternalServerError>{
                body: {message: "Failed to fetch micro-app ZIP from database"}
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
    isolated resource function post micro\-apps/upload(http:Request req) returns json|http:BadRequest|http:InternalServerError {
        var bodyParts = req.getBodyParts();
        if bodyParts is error {
            log:printError("Failed to parse multipart body", bodyParts);
            return <http:BadRequest>{
                body: {"error": "Bad Request: Invalid multipart/form-data"}
            };
        }

        string name = "";
        string version = "";
        string appId = "";
        string iconUrlPath = "";
        byte[] zipData = [];
        string description = "";

        foreach var part in bodyParts {
            var disposition = part.getContentDisposition();
            string fieldName = disposition.name;
            if fieldName == "zipFile" {
                var byteArray = part.getByteArray();
                if byteArray is error {
                    log:printError("Failed to get byte array for ZIP file", byteArray);
                    return <http:BadRequest>{
                        body: {"error": "Bad Request: Invalid ZIP file"}
                    };
                }
                zipData = byteArray;
            } else if fieldName == "name" {
                var text = part.getText();
                if text is error {
                    log:printError("Failed to get text for name", text);
                    return <http:BadRequest>{
                        body: {"error": "Bad Request: Invalid name"}
                    };
                }
                name = text;
            } else if fieldName == "version" {
                var text = part.getText();
                if text is error {
                    log:printError("Failed to get text for version", text);
                    return <http:BadRequest>{
                        body: {"error": "Bad Request: Invalid version"}
                    };
                }
                version = text;
            } else if fieldName == "appId" {
                var text = part.getText();
                if text is error {
                    log:printError("Failed to get text for appId", text);
                    return <http:BadRequest>{
                        body: {"error": "Bad Request: Invalid appId"}
                    };
                }
                appId = text;
            } else if fieldName == "iconUrlPath" {
                var text = part.getText();
                if text is error {
                    log:printError("Failed to get text for iconUrlPath", text);
                    return <http:BadRequest>{
                        body: {"error": "Bad Request: Invalid iconUrlPath"}
                    };
                }
                iconUrlPath = text;
            } else if fieldName == "description" {
                var text = part.getText();
                if text is error {
                    log:printError("Failed to get text for description", text);
                    return <http:BadRequest>{
                        body: {"error": "Bad Request: Invalid description"}
                    };
                }
                description = text;
            }
        }

        if zipData.length() == 0 {
            log:printError("ZIP file not found in request");
            return <http:BadRequest>{
                body: {"error": "Bad Request: ZIP file is required"}
            };
        }

        if name.trim() == "" || version.trim() == "" || appId.trim() == "" {
            return <http:BadRequest>{
                body: {"error": "Bad Request: name, version, and appId are required"}
            };
        }

        error? result = insertMicroAppWithZip(name, version, zipData, appId, iconUrlPath, description);
        if result is error {
            log:printError("Failed to insert micro-app", result);
            return <http:InternalServerError>{
                body: {"error": "Internal server error"}
            };
        }

        log:printInfo("Micro-app uploaded successfully: " + name);
        return {"message": "Micro-app uploaded successfully"};
    }

    # Fetch the icon for a micro-app by its app ID from the database.
    #
    # + ctx - Request context
    # + appId - App ID of the micro-app (used as iconName for compatibility)
    # + return - HTTP response with icon image or an error
    isolated resource function get micro\-apps/[string appId]/icon(http:RequestContext ctx) returns http:Response|http:NotFound|http:InternalServerError {
        log:printInfo("Attempting to fetch icon for micro-app with app ID: " + appId);

        MicroAppIcon|error result = fetchMicroAppIconById(appId);
        if result is error {
            log:printError("Error fetching icon for micro-app with app ID: " + appId, result);
            if result.message().startsWith("No icon found") {
                return <http:NotFound>{
                    body: {message: "Icon not found for micro-app with app ID: " + appId}
                };
            }
            return <http:InternalServerError>{
                body: {message: "Failed to fetch icon from database"}
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
