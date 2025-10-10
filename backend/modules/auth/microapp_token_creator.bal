import ballerina/jwt;
import ballerina/uuid; 

configurable string superappIssuer = ?;
configurable decimal tokenTTLSeconds = ?;

public isolated function createMicroappJWT(string user_id, string microAppId) returns string|error {
    jwt:IssuerConfig issuerConfig = {
        issuer: superappIssuer,
        audience: microAppId, 
        expTime: tokenTTLSeconds,
        customClaims: {
            "user_id": user_id,
            "micro_app_id": microAppId,
            "jti": uuid:createType1AsString()
        },
        signatureConfig: {
            config: {
                keyFile: privateKeyPath
            }
        }
    };
    // Issue (sign) the JWT
    string|jwt:Error token = jwt:issue(issuerConfig);
    
    if token is jwt:Error {
        return token;
    }
    return token;
}

public isolated function getExpireTime() returns decimal {
    return tokenTTLSeconds;
}