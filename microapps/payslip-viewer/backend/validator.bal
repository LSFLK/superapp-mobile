import ballerina/http;
import ballerina/jwt;
// import ballerina/io;
import ballerina/log;

configurable string publicKeyPath = ?; // e.g., "./public.pem" locally, "/public.pem" in Choreo

# To handle authorization for each resource function invocation.
service class JwtInterceptor {

    *http:RequestInterceptor;
    isolated resource function default [string... path](http:RequestContext ctx, http:Request req)
        returns http:NextService|http:InternalServerError|error? {

        jwt:ValidatorConfig validatorConfig = {
            issuer: "superapp-issuer",
            audience: "payslip-viewer",
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
        //io:println("JWT validation successful. Payload: " + payload.toString());

        if (payload is jwt:Error) {
            string errorMsg = "JWT validation failed! Unauthorized !!!";
            log:printError(errorMsg, payload);
            return <http:InternalServerError>{
                body: {
                    message: errorMsg
                }
            };
        }
        // io:println("JWT validation successful. Payload: " + payload.toString());
        
        return ctx.next();
    }
}