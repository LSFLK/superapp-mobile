import ballerina/http;
import ballerina/jwt;
import ballerina/log;

// To handle authorization for each resource function invocation.
isolated service class JwtInterceptor {

    *http:RequestInterceptor;
    isolated resource function default [string... path](http:RequestContext ctx, http:Request req)
        returns http:NextService|http:InternalServerError|error? {

        jwt:ValidatorConfig validatorConfig = {};
        validatorConfig = {
                issuer: ISSUER,
                audience: [AUDIENCE_1, AUDIENCE_2],
                signatureConfig: {
                    certFile: publicKeyPath
                }
            };  


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
        
        return ctx.next();
    }
}