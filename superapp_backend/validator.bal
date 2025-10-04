import ballerina/http;
import ballerina/io;
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

        jwt:Payload|jwt:Error payload = jwt:validate(idToken, validatorConfig);

        if (payload is jwt:Error) {
            string errorMsg = "JWT validation failed! Unauthorized !!!";
            log:printError(errorMsg, payload);
            return <http:InternalServerError>{
                body: {
                    message: errorMsg
                }
            };
        }

        string[] groups = [];

        // Parsing the json[] from the payload to string[]
        if payload.hasKey("groups") {
            json[] groupsJson = <json[]>payload["groups"];
            foreach json g in groupsJson {
                if g is string {
                    groups.push(g);
                }
            }
        }

        string fullPath = req.rawPath;

        if !validateAccess(fullPath, groups) {
            return <http:InternalServerError>{
                body: {
                    message: "Forbidden: admin role required"
                }
            };
        }

        return ctx.next();
    }
}

isolated function validateAccess(string endpoint, string[] groups) returns boolean {

    // If you need to add any other roles to a specific endpoint the mapping should be added here.
    // The role checking and authorization process is then handled automatically through the defined functions
    final map<string[]> endpointRoles = {
        "/micro-apps/upload": ["superapp_admin"]
    };

    string[]? requiredRoles = endpointRoles[endpoint];

    if requiredRoles is () {
        // No rule defined → public for authenticated users
        return true;
    }

    // Check all required roles are present in groups
    foreach string role in requiredRoles {
        if !containsElement(groups, role) {
            return false;
        }
    }

    return true;
};

isolated function containsElement(string[] array, string element) returns boolean {
    int? index = array.indexOf(element);
    if (index is int) {
        log:printInfo(element + " found !");
        return true;
    } else {
        io:println(element + " not found in the array.");
        return false;
    }
};