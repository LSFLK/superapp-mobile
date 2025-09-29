import ballerina/log;
import ballerina/jwt;
import ballerina/uuid; 

// Standalone function to create the microapp-specific JWT
// Usage: string|error token = createMicroappJWT("emp-123", "app-456");
public isolated function createMicroappJWT(string empId, string microAppId) returns string|error {
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