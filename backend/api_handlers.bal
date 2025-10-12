// ============================================================================
// API Handlers Module
// ============================================================================
// This module contains all the API endpoint handler logic
// ============================================================================

import ballerina/http;

import superapp_backend.database;
import superapp_backend.auth;
import superapp_backend.logging;
import superapp_backend.validation;

// ============================================================================
// Micro-App Token Handler
// ============================================================================

// Generates a JWT token for micro-app authentication
public isolated function handleMicroAppToken(string userId, string microAppId) 
    returns json|http:BadRequest|http:InternalServerError {
    
    // Validate input parameters
    if userId.trim() == "" || microAppId.trim() == "" {
        logging:log({level: "ERROR", message: "Missing or empty user_id or micro_app_id"});
        return <http:BadRequest>{
            body: {"error": "Bad Request: user_id and micro_app_id are required"}
        };
    }

    // Generate the microapp-specific JWT
    string|error token = auth:createMicroappJWT(userId, microAppId);
    if token is error {
        logging:log({level: "ERROR", message: "Failed to generate JWT for user_id: " + userId + ", micro_app_id: " + microAppId , context: {"error": token.toString()}});
        return <http:InternalServerError>{
            body: {"error": "Internal server error"}
        };
    }

    // Return the token in JSON response
    json response = {"token": token, "expiresAt": auth:getExpireTime()};
    logging:log({
        level: "INFO",
        message: "Successfully generated JWT for user_id: " + userId + ", micro_app_id: " + microAppId
    });
    return response;
}

// ============================================================================
// User Handlers
// ============================================================================

// Updates the downloaded app IDs for a user
public isolated function handleUpdateUserApps(string email, http:Request req) 
    returns json|http:BadRequest|http:InternalServerError|http:ClientError {
    
    json|error payload = req.getJsonPayload();
    if payload is error {
        logging:log({level: "ERROR", message: "Invalid JSON payload", context: {"error": payload.toString()}});
        return <http:BadRequest>{
            body: {"error": "Invalid JSON payload"}
        };
    }

    // Call the database function
    error? result = database:updateUserDownloadedApps(email, payload);
    if result is error {
        logging:log({level: "ERROR", message: "Failed to update downloaded apps for email: " + email, context: {"error": result.toString()}});
        return <http:InternalServerError>{
            body: {"error": "Internal server error"}
        };
    }

    // Send success response
    json response = {"status": "success", "message": "Downloaded apps updated successfully"};
    logging:LogRecord logRecord = {
        level: "INFO",
        message: "Successfully updated downloaded apps for email: " + email
    };
    logging:log(logRecord);
    return response;
}

// Fetches a user by email from the database
public isolated function handleGetUser(string email) 
    returns database:User|http:NotFound|http:InternalServerError {
    
    database:User|error result = database:fetchUserByEmail(email);
    if result is error {
        logging:LogRecord logRecord = {
            level: "ERROR",
            message: "Error fetching user with email: " + email,
            context: {"result": result.toString()}
        };
        logging:log(logRecord);
        logging:log({level: "ERROR", message: "Error fetching user", context: {"error": result.toString()}});
        if result.message().startsWith("No user found") {
            return <http:NotFound>{
                body: {message: "User not found for email: " + email}
            };
        }
        return <http:InternalServerError>{
            body: {message: "Failed to fetch user from database"}
        };
    }
    logging:LogRecord logRecord = {
        level: "INFO",
        message: "Successfully fetched user with email: " + email
    };
    logging:log(logRecord);
    return result;
}

// ============================================================================
// Micro-App Handlers
// ============================================================================

// Fetches all micro-apps from the database
public isolated function handleGetAllMicroApps() 
    returns database:MicroApp[]|http:InternalServerError {
    
    database:MicroApp[]|error result = database:fetchAllMicroApps();
    if result is error {
        logging:LogRecord logRecord = {
            level: "ERROR",
            message: "Error fetching micro-apps from database",
            context: {"result": result.toString()}
        };
        logging:log(logRecord);
        logging:log({level: "ERROR", message: "Error fetching micro-apps", context: {"error": result.toString()}});
        return <http:InternalServerError>{
            body: {message: "Failed to fetch micro-apps from database"}
        };
    }
    logging:LogRecord logRecord = {
        level: "INFO",
        message: "Successfully fetched " + result.length().toString() + " micro-apps"
    };
    logging:log(logRecord);
    return result;
}

// Fetches a specific micro-app by ID
public isolated function handleGetMicroApp(string appId) 
    returns database:MicroApp|http:NotFound|http:InternalServerError {

    database:MicroApp|error result = database:fetchMicroAppById(appId);
    if result is error {
        logging:LogRecord logRecord = {
            level: "ERROR",
            message: "Error fetching micro-app with app ID: " + appId,
            context: {"result": result.toString()}
        };
        logging:log(logRecord);
        logging:log({level: "ERROR", message: "Error fetching micro-app", context: {"error": result.toString()}});
        if result.message().startsWith("No micro-app found") {
            return <http:NotFound>{
                body: {message: "Micro-app not found for app ID: " + appId}
            };
        }
        return <http:InternalServerError>{
            body: {message: "Failed to fetch micro-app from database"}
        };
    }
    logging:LogRecord logRecord = {
        level: "INFO",
        message: "Successfully fetched micro-app with app ID: " + appId
    };
    logging:log(logRecord);
    return result;
}

// Downloads the ZIP file for a micro-app
public isolated function handleDownloadMicroApp(string appId) 
    returns http:Response|http:NotFound|http:InternalServerError {
    
    logging:log({level: "INFO", message: "Attempting to download micro-app ZIP with app ID: " + appId});

    database:MicroAppDownload|error result = database:fetchMicroAppZipById(appId);
    if result is error {
        logging:LogRecord logRecord = {
            level: "ERROR",
            message: "Error fetching micro-app ZIP with app ID: " + appId,
            context: {"result": result.toString()}
        };
        logging:log(logRecord);
        logging:log({level: "ERROR", message: "Error fetching ZIP", context: {"error": result.toString()}});
        
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
        logging:log({level: "ERROR", message: "Error setting content type", context: {"error": contentTypeResult.toString()}});
    }

    error? headerResult = response.setHeader("Content-Disposition", "attachment; filename=\"" + appId + ".zip\"");
    if headerResult is error {
        logging:log({level: "ERROR", message: "Error setting header", context: {"error": headerResult.toString()}});
    }

    logging:log({level: "INFO", message: "Successfully serving ZIP file for micro-app: " + appId});
    return response;
}

// Fetches the icon for a micro-app
public isolated function handleGetMicroAppIcon(string appId) 
    returns http:Response|http:NotFound|http:InternalServerError {
    
    logging:LogRecord logRecord = {
        level: "INFO",
        message: "Attempting to fetch icon for micro-app with app ID: " + appId
    };
    logging:log(logRecord);

    database:MicroAppIcon|error result = database:fetchMicroAppIconById(appId);
    if result is error {
        logRecord = {
            level: "ERROR",
            message: "Error fetching icon for micro-app with app ID: " + appId,
            context: {"result": result.toString()}
        };
        logging:log(logRecord);
        logging:log({level: "ERROR", message: "Error fetching icon", context: {"error": result.toString()}});
        
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
    
    logRecord = {
        level: "INFO",
        message: "Successfully serving icon for micro-app: " + appId
    };
    logging:log(logRecord);
    
    return response;
}

// Uploads a micro-app with ZIP file
public isolated function handleUploadMicroApp(http:Request req) 
    returns json|http:BadRequest|http:InternalServerError {
    
    var bodyParts = req.getBodyParts();
    if bodyParts is error {
        logging:LogRecord logRecord = {
            level: "ERROR",
            message: "Failed to parse multipart body",
            context: {"bodyParts": bodyParts.toString()}
        };
        logging:log(logRecord);
        logging:log({level: "ERROR", message: "Failed to parse multipart body", context: {"error": bodyParts.toString()}});
        
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
    string zipFileName = "";

    foreach var part in bodyParts {
        var disposition = part.getContentDisposition();
        string fieldName = disposition.name;
        if fieldName == "zipFile" {
            var byteArray = part.getByteArray();
            if byteArray is error {
                logging:LogRecord logRecord = {
                    level: "ERROR",
                    message: "Failed to get byte array for ZIP file"
                };
                logging:log(logRecord);
                logging:log({level: "ERROR", message: "Failed to get byte array for ZIP file", context: {"error": byteArray.toString()}});
                
                return <http:BadRequest>{
                    body: {"error": "Bad Request: Invalid ZIP file"}
                };
            }
            zipData = byteArray;
            zipFileName = disposition.fileName;
        } else if fieldName == "name" {
            var text = part.getText();
            if text is error {
                logging:LogRecord logRecord = {
                    level: "ERROR",
                    message: "Failed to get text for name"
                };
                logging:log(logRecord);
                logging:log({level: "ERROR", message: "Failed to get text for name", context: {"error": text.toString()}});
                
                return <http:BadRequest>{
                    body: {"error": "Bad Request: Invalid name"}
                };
            }
            name = text;
        } else if fieldName == "version" {
            var text = part.getText();
            if text is error {
                logging:LogRecord logRecord = {
                    level: "ERROR",
                    message: "Failed to get text for version",
                    context: {"text": text.toString()}
                };
                logging:log(logRecord);
                logging:log({level: "ERROR", message: "Failed to get text for version", context: {"error": text.toString()}});
                
                return <http:BadRequest>{
                    body: {"error": "Bad Request: Invalid version"}
                };
            }
            version = text;
        } else if fieldName == "appId" {
            var text = part.getText();
            if text is error {
                logging:LogRecord logRecord = {
                    level: "ERROR",
                    message: "Failed to get text for appId",
                    context: {"text": text.toString()}
                };
                logging:log(logRecord);
                logging:log({level: "ERROR", message: "Failed to get text for appId", context: {"error": text.toString()}});
                
                return <http:BadRequest>{
                    body: {"error": "Bad Request: Invalid appId"}
                };
            }
            appId = text;
        } else if fieldName == "iconUrlPath" {
            var text = part.getText();
            if text is error {
                logging:LogRecord logRecord = {
                    level: "ERROR",
                    message: "Failed to get text for iconUrlPath",
                    context: {"text": text.toString()}
                };
                logging:log(logRecord);
                logging:log({level: "ERROR", message: "Failed to get text for iconUrlPath", context: {"error": text.toString()}});
                
                return <http:BadRequest>{
                    body: {"error": "Bad Request: Invalid iconUrlPath"}
                };
            }
            iconUrlPath = text;
        } else if fieldName == "description" {
            var text = part.getText();
            if text is error {
                logging:LogRecord logRecord = {
                    level: "ERROR",
                    message: "Failed to get text for description",
                    context: {"text": text.toString()}
                };
                logging:log(logRecord);
                logging:log({level: "ERROR", message: "Failed to get text for description", context: {"error": text.toString()}});
                
                return <http:BadRequest>{
                    body: {"error": "Bad Request: Invalid description"}
                };
            }
            description = text;
        }
    }

    if zipData.length() == 0 {
        logging:LogRecord logRecord = {
            level: "ERROR",
            message: "ZIP file not found in request"
        };
        logging:log(logRecord);
        logging:log({level: "ERROR", message: "ZIP file not found in request"});
        
        return <http:BadRequest>{
            body: {"error": "Bad Request: ZIP file is required"}
        };
    }

    if name.trim() == "" || version.trim() == "" || appId.trim() == "" {
        return <http:BadRequest>{
            body: {"error": "Bad Request: name, version, and appId are required"}
        };
    }

    // ZIP Validation
    validation:ZipValidationResult validationResult = validation:validateZipFile(zipData, zipFileName);
    
    if !validationResult.isValid {
        logging:LogRecord logRecord = {
            level: "ERROR",
            message: "ZIP file validation failed: " + validationResult.errors.toString()
        };
        logging:log(logRecord);
        logging:log({level: "ERROR", message: "ZIP file validation failed", context: {"errors": validationResult.errors.toString()}});
        
        return <http:BadRequest>{
            body: {"error": "ZIP file validation failed", "details": validationResult.errors}
        };
    }

    string[]? allowed_Functions = [];

    // Insert micro app
    error? result = database:insertMicroAppWithZip(name, version, zipData, appId, iconUrlPath, description, allowed_Functions);
    if result is error {
        logging:LogRecord logRecord = {
            level: "ERROR",
            message: "Failed to insert micro-app",
            context: {"result": result.toString()}
        };
        logging:log(logRecord);
        logging:log({level: "ERROR", message: "Failed to insert micro-app", context: {"error": result.toString()}});
        
        return <http:InternalServerError>{
            body: {"error": "Failed to insert micro-app"}
        };
    }
    
    logging:LogRecord logRecord = {
        level: "INFO",
        message: "Micro-app uploaded successfully: " + name
    };
    logging:log(logRecord);
    
    return {"message": "Micro-app uploaded successfully"};
}
