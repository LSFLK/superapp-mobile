import ballerina/log;
import ballerina/jwt;
import ballerina/uuid; 

// Standalone function to create the microapp-specific JWT
// Usage: string|error token = createMicroappJWT("emp-123", "app-456");
public isolated function createMicroappJWT(string user_id, string microAppId) returns string|error {
    
    // Build IssuerConfig for JWT
    jwt:IssuerConfig issuerConfig = {
        issuer: superappIssuer, // Issuer (your superapp backend)
        audience: microAppId, // Audience as a string array for microapp backend
        expTime: tokenTTLSeconds, // Expiry in seconds (relative to iat)
        customClaims: {
            "user_id": user_id, // User user_id as subject
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
        LogRecord logRecord = {
            level: "ERROR",
            message: "Failed to issue JWT",
            context: {"token":token.toString()}
        };
        createLog(logRecord); 
        log:printError("Failed to issue JWT", 'error = token);
        return token;
    }

    LogRecord logRecord = {
        level: "INFO",
        message: "Generated microapp JWT for user_id: " + user_id + ", micro_app_id: " + microAppId
    };
    createLog(logRecord); 
    log:printInfo("Generated microapp JWT for user_id: " + user_id + ", micro_app_id: " + microAppId);
    
    return token;
}