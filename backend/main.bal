import ballerina/http;
import ballerina/io;
import ballerina/lang.runtime;
import ballerina/log;
import ballerina/time;

import superapp_backend.database;
import superapp_backend.auth;
import superapp_backend.logging;

// ============================================================================
// Service Initialization
// ============================================================================

function init() {
    logging:log({level: "INFO", message: "Initializing the superapp backend service...", context: {"environment": environment, "port": serverPort, "debugMode": debugMode}});
    io:println("========================================");
    io:println("Superapp Backend Service");
    io:println("Environment: " + environment);
    io:println("Port: " + serverPort.toString());
    io:println("========================================");
    error? dbValidation = database:validateDatabaseConnection();
    if dbValidation is error {
        logging:log({level: "ERROR", message: "Failed to validate database connection on startup", context: {"error": dbValidation.toString()}});
        io:println("ERROR: Database validation failed - " + dbValidation.message());
    } else {
        logging:log({level: "INFO", message: "Database connection validated successfully"});
        io:println("Database connection validated successfully");
    }
    logging:log({level: "INFO", message: "Superapp backend initialization complete"});
    io:println("Initialization complete. Service is ready.");
    io:println("========================================");


    runtime:onGracefulStop(database:stopHandler);
}

// ============================================================================
// Error Interceptor
// ============================================================================

service class ErrorInterceptor {
    *http:ResponseErrorInterceptor;

    remote function interceptResponseError(error err, http:RequestContext ctx) returns http:BadRequest|error {
        if err is http:PayloadBindingError {
            string customError = "Payload binding failed!";
            logging:log({level: "ERROR", message: customError, context: {"error": err.toString()}});
            return {
                body: {
                    message: customError
                }
            };
        }
        return err;
    }
}

// ============================================================================
// HTTP Listener Configuration
// ============================================================================

// HTTP Listener without TLS (recommended: use API Gateway for TLS in production)
listener http:Listener httpListener = check new (serverPort, 
    config = {
        requestLimits: {
            maxHeaderSize: maxHeaderSize,
            maxEntityBodySize: maxEntityBodySize * 1024 * 1024 // Convert MB to bytes
        },
        timeout: requestTimeout
    }
);

////////// HTTP listner with TLS (If required) [IMPORTANT: This is implemented to issue and validate a self-signed cert and this method is only recommended for local setup. For production, you can either use an API gateway or a trusted CA to provide a certificate and handle secured routing.]
// listener http:Listener _httpListner = new (serverPort, 
//     config = {
//         requestLimits: {maxHeaderSize},
//         secureSocket: {
//             key: {
//                 certFile: selfSignedCertFile,
//                 keyFile: selfSignedKeyFile
//             }
//         }
//     }
// );

// ============================================================================
// Main HTTP Service
// ============================================================================

// CORS configuration for frontend access
@http:ServiceConfig {
    cors: {
        allowOrigins: allowedOrigins,
        allowCredentials: corsAllowCredentials,
        allowHeaders: ["Authorization", "Content-Type", "x-jwt-assertion"],
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        maxAge: 3600
    }
}
isolated service http:InterceptableService / on httpListener {

    // Register interceptors for error handling and authentication
    public function createInterceptors() returns http:Interceptor[] =>
        [
            new ErrorInterceptor(),
            new auth:JwtInterceptor()
        ];

    // ========================================================================
    // Health Check Endpoints
    // ========================================================================

    // Detailed health check endpoint
    isolated resource function get health(http:RequestContext ctx) returns json {
        log:printInfo("Health check endpoint accessed");
        
        if !enableDetailedHealth {
            return {"status": "ok", "timestamp": time:utcNow()[0].toString()};
        }
        
        // Detailed health check
        json response = {
            "status": "ok",
            "timestamp": time:utcNow()[0].toString(),
            "environment": environment,
            "version": "1.0.0"
        };
        
        // Include database health if enabled
        if includeDbHealthCheck {
            boolean dbHealthy = database:checkDatabaseHealth();
            response = {
                "status": "ok",
                "timestamp": time:utcNow()[0].toString(),
                "environment": environment,
                "version": "1.0.0",
                "database": dbHealthy ? "healthy" : "unhealthy"
            };
        }
        
        return response;
    }


    // ========================================================================
    // Authentication Endpoints
    // ========================================================================

    // Generate micro-app specific JWT token
    isolated resource function get micro\-app\-token(
        http:RequestContext ctx, 
        string user_id, 
        string micro_app_id
    ) returns json|http:BadRequest|http:InternalServerError {
        return handleMicroAppToken(user_id, micro_app_id);
    }

    // ========================================================================
    // User Management Endpoints
    // ========================================================================

    // Update user's downloaded apps
    isolated resource function post users/[string email]/apps(
        http:RequestContext ctx, 
        http:Request req
    ) returns json|http:BadRequest|http:InternalServerError|http:ClientError {
        return handleUpdateUserApps(email, req);
    }

    // Fetch user by email
    isolated resource function get users/[string email](
        http:RequestContext ctx
    ) returns database:User|http:NotFound|http:InternalServerError {
        return handleGetUser(email);
    }

    // ========================================================================
    // Micro-App Management Endpoints
    // ========================================================================

    // Fetch all micro-apps
    isolated resource function get micro\-apps(
        http:RequestContext ctx
    ) returns database:MicroApp[]|http:InternalServerError {
        return handleGetAllMicroApps();
    }

    // Fetch specific micro-app by ID
    isolated resource function get micro\-apps/[string appId](
        http:RequestContext ctx
    ) returns database:MicroApp|http:NotFound|http:InternalServerError {
        return handleGetMicroApp(appId);
    }

    // Download micro-app ZIP file
    isolated resource function get micro\-apps/[string appId]/download(
        http:RequestContext ctx
    ) returns http:Response|http:NotFound|http:InternalServerError {
        return handleDownloadMicroApp(appId);
    }

    // Fetch micro-app icon
    isolated resource function get micro\-apps/[string appId]/icon(
        http:RequestContext ctx
    ) returns http:Response|http:NotFound|http:InternalServerError {
        return handleGetMicroAppIcon(appId);
    }

    // Upload micro-app
    isolated resource function post micro\-apps/upload(
        http:Request req
    ) returns json|http:BadRequest|http:InternalServerError {
        return handleUploadMicroApp(req);
    }
}
