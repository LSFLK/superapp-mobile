import ballerina/http;
import ballerina/jwt;
//import ballerina/io;
import ballerina/log;

configurable string publicKeyPath = ?; // e.g., "./public.pem" locally, "/public.pem" in Choreo

public isolated function extractEmployeeId(jwt:Payload payload) returns string|error {
    anydata|error empClaim = payload["emp_id"];

    if empClaim is error {
        return error("emp_id claim not found in JWT payload");
    }

    if empClaim is string {
        return empClaim;
    }

    return error("emp_id claim is not a string");
}

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
        
        // if payload is jwt:Payload {
        //     log:printInfo("JWT payload: " + payload.toString());
        // }

        if (payload is jwt:Error) {
            string errorMsg = "JWT validation failed! Unauthorized !!!";
            log:printError(errorMsg, payload);
            return <http:InternalServerError>{
                body: {
                    message: errorMsg
                }
            };
        }


        //Extract emp_id
        string|error empId = extractEmployeeId(payload);
        if empId is error {
            log:printError("Failed to extract emp_id", empId);
            return <http:InternalServerError>{
                body: { message: "Invalid token: emp_id missing" }
            };
        }

        log:printInfo("Authenticated employee ID: " + empId);


        ctx.set("emp_id", empId);
        
        return ctx.next();
    }
}