// ==============================
// JWT Validator & Interceptor
// ==============================
// Handles JWT validation for microapp and admin portal endpoints.
// Responsibilities:
// - Extract employee ID from JWT payload
// - Validate JWT based on issuer, audience, and public key
// - Intercept requests and attach emp_id to request context
// - Allow public endpoints like /health without validation
// ==============================

import ballerina/http;
import ballerina/jwt;
import ballerina/log;

// Configurable paths for public keys (different for payslip and admin portal)
configurable string publicKeyPath_microapp = ?; // e.g., "./public.pem" locally, "/public.pem" in Choreo
configurable string publicKeyPath_adminPortal = ?; // e.g., "./public.pem" locally, "/public.pem" in Choreo

// Extracts the user_id claim from JWT payload
public isolated function extractUserId(jwt:Payload payload) returns string|error {
    anydata|error userClaim = payload["user_id"];

    if userClaim is error {
        return error("user_id claim not found in JWT payload");
    }

    if userClaim is string {
        return userClaim;
    }

    return error("user_id claim is not a string");
}


// Interceptor service to handle authorization for each incoming request
service class JwtInterceptor {

    *http:RequestInterceptor;

    // Default interceptor triggered for all resource function calls
    isolated resource function default [string... path](http:RequestContext ctx, http:Request req)
        returns http:NextService|http:InternalServerError|error? {

        // Skip validation for public health endpoint
        string fullPath = req.rawPath;
        if fullPath.startsWith("/health"){
            log:printInfo("Public endpoint accessed: " + fullPath);
            return ctx.next();
        }

        // Configure validator based on endpoint type
        jwt:ValidatorConfig validatorConfig = {};

        if fullPath.startsWith("/admin-portal") {
            log:printInfo("From admin portal endpoints "+fullPath);
            validatorConfig = {
                issuer: ASGARDEO_ISSUER,
                audience: ASGARDEO_AUDIENCE,
                signatureConfig: {
                    certFile: publicKeyPath_adminPortal
                }
            };
        } else {
            log:printInfo("From microapp endpoints "+fullPath);
            validatorConfig = {
                issuer: MICROAPP_ISSUER,
                audience: MICROAPP_AUDIENCE,
                signatureConfig: {
                    certFile: publicKeyPath_microapp
                }
            };
        }  


        // Extract JWT token from request header
        string|error idToken = req.getHeader(JWT_ASSERTION_HEADER);

        if idToken is error {
            string errorMsg = "Missing invoker info header!";
            log:printError(errorMsg, idToken);
            return <http:InternalServerError>{
                body: {
                    message: errorMsg
                }
            };
        }

        // Validate JWT
        jwt:Payload | jwt:Error payload = jwt:validate(idToken, validatorConfig);

        if (payload is jwt:Error) {
            string errorMsg = "JWT validation failed! Unauthorized !!!";
            log:printError(errorMsg, payload);
            return <http:InternalServerError>{
                body: {
                    message: errorMsg
                }
            };
        }

        // For microapp endpoints, extract employee ID and attach to context
        if !fullPath.startsWith("/admin-portal") {
             //Extract user_id
            string|error userId = extractUserId(payload);
            if userId is error {
                log:printError("Failed to extract user_id", userId);
                return <http:InternalServerError>{
                    body: { message: "Invalid token: user_id missing" }
                };
            }

            log:printInfo("Authenticated user ID: " + userId);
            ctx.set("user_id", userId);
        }
       
        
        return ctx.next();
    }
}