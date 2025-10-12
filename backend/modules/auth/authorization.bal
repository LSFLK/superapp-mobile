import ballerina/http;
import ballerina/jwt;
import ballerina/log;

configurable boolean enable = true;
configurable string privateKeyPath = ?;
configurable string publicKeyPath = ?;

final readonly & jwt:ValidatorConfig validatorConfig = {
    issuer: ISSUER,
    audience: [SUPERAPP_MOBILE_AUDIENCE, SUPERAPP_ADMIN_PORTAL_AUDIENCE],
    signatureConfig: {
        certFile: publicKeyPath
    }
};

public isolated service class JwtInterceptor {
    *http:RequestInterceptor;

    isolated resource function default [string... path](http:RequestContext ctx, http:Request req)
        returns http:NextService|http:InternalServerError|error? {

        if !enable {
            return ctx.next();
        }

        string|error accessToken = req.getHeader(JWT_ASSERTION_HEADER);

        if accessToken is error {
            log:printError(ERR_MSG_NO_ACCESS_TOKEN, accessToken);
            return <http:InternalServerError>{
                body: {
                    message: ERR_MSG_NO_ACCESS_TOKEN
                }
            };
        }
        // check signature, issuer, audience, expiration
        jwt:Payload|jwt:Error payload = jwt:validate(accessToken, validatorConfig);

        if (payload is jwt:Error) {
            log:printError(ERR_MSG_JWT_VALIDATION_FAILED, payload);
            return <http:InternalServerError>{
                body: {
                    message: ERR_MSG_JWT_VALIDATION_FAILED
                }
            };
        }
        // check roles
        string[] groups = getGroupsFromPayload(payload);
        string fullPath = req.rawPath;

        if !isAllowed(fullPath, groups) {
            return <http:InternalServerError>{
                body: {
                    message: ERR_MSG_ACCESS_DENIED
                }
            };
        }
        return ctx.next();
    }
}
