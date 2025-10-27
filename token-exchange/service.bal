import ballerina/http;
import ballerina/log;

import token_exchange.authorization;
import token_exchange.token_service;

configurable int maxHeaderSize = 16384;

@display {
    label: "Token Exchange Service",
    id: "open-operations/token-exchange-service"
}
service class ErrorInterceptor {
    *http:ResponseErrorInterceptor;

    remote function interceptResponseError(error err, http:RequestContext ctx) returns http:BadRequest|error {
        if err is http:PayloadBindingError {
            string customError = "Payload binding failed!";
            log:printError(customError, err);
            return {
                body: {
                    message: customError
                }
            };
        }
        return err;
    }
}

listener http:Listener httpListener = new http:Listener(9090, config = {requestLimits: {maxHeaderSize}});

service /\.well\-known on httpListener {

    # Serves the JSON Web Key Set (JWKS) for token verification (public endpoint, no authentication)
    #
    # + return - JWKS response or error
    resource function get jwks() returns token_service:JsonWebKeySet|http:InternalServerError {
        token_service:JsonWebKeySet|error jwks = token_service:getJWKS();
        if jwks is error {
            string customError = "Failed to read JWKS";
            log:printError(customError, jwks);
            return <http:InternalServerError>{
                body: {message: customError}
            };
        }
        
        return jwks;
    }
}

service http:InterceptableService / on httpListener {

    # + return - authorization:JwtInterceptor, ErrorInterceptor
    public function createInterceptors() returns http:Interceptor[] =>
        [new ErrorInterceptor(), new authorization:JwtInterceptor()];

    function init() {
        log:printInfo("Token Exchange Service started at port 9090");
    }

    # Request a JWT for authorization.
    #
    # + ctx - Request context
    # + request - Token request payload
    # + return - `TokenResponse` with the generated JWT token on success, or errors on failure
    isolated resource function post token(http:RequestContext ctx, token_service:TokenRequest request)
        returns token_service:TokenResponse|http:InternalServerError|http:BadRequest {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {message: ERR_MSG_USER_HEADER_NOT_FOUND}
            };
        }

        string|error token = token_service:issueJWT(userInfo.email, request.clientId);
        if token is error {
            string customError = "Error occurred while generating JWT token";
            log:printError(customError, token);
            return <http:InternalServerError>{
                body: {message: customError}
            };
        }
        log:printInfo("Issued token for user: " + userInfo.email + " and clientId: " + request.clientId);

        return <token_service:TokenResponse>{
            token: token
        };
    }
}