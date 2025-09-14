// import ballerina/io;

// public function main() {
//     io:println("Hello, World!");
// }

import ballerina/http;
import ballerina/log;
import ballerina/io;

configurable int maxHeaderSize = 16384;

// Mock Employee type matching the original entity:Employee
type MockEmployee record {|
    string workEmail;
    string firstName;
    string lastName;
    string? employeeThumbnail;
    string department;
    string employeeID;
|};

function getMockEmployees() returns MockEmployee[] {
    return [      
        {   
            "workEmail": "john@gov.com",
            "firstName": "John",
            "lastName": "Doe",
            "employeeThumbnail": "https://example.com/avatars/john.jpg",
            "department": "Ministry of Finance",
            "employeeID": "EMP001"
        },
        {
            "workEmail": "jane@gov.com",
            "firstName": "Jane",
            "lastName": "Smith",
            "employeeThumbnail": "https://example.com/avatars/jane.jpg",
            "department": "Ministry of Health",
                        "employeeID": "EMP002"

        },
        {
            "workEmail": "michael@gov.com",
            "firstName": "Michael",
            "lastName": "Brown",
            "employeeThumbnail": null,
            "department": "Ministry of Education",
                        "employeeID": "EMP003"

        },
        {
            "workEmail": "sarah@gov.com",
            "firstName": "Sarah",
            "lastName": "Lee",
            "employeeThumbnail": "https://example.com/avatars/sarah.jpg",
            "department": "Ministry of Transport",
                        "employeeID": "EMP004"

        },
        {
            "workEmail": "mark@gov.com",
            "firstName": "Mark",
            "lastName": "Town",
            "employeeThumbnail": null,
            "department": "Ministry of Defence",
                        "employeeID": "EMP005"

        },
        {
            "workEmail": "mockuser@gov.com",
            "firstName": "Mock",
            "lastName": "User",
            "employeeThumbnail": null,
            "department": "Ministry of Public Administration",
                        "employeeID": "EMP006"
        }
    ];
}

// Mock MicroApp types
type MockMicroAppVersion record {|
    string version;
    int build;
    string releaseNotes;
    string iconUrl;
    string downloadUrl;
|};

type MockMicroApp record {|
    string name;
    string description;
    string promoText;
    string appId;
    string iconUrl;
    string bannerImageUrl;
    int isMandatory; // 0 or 1
    MockMicroAppVersion[] versions; 
|};

function getMockMicroApps() returns MockMicroApp[] {
    return [
        {
            "name": "Payslip Viewer",
            "description": "View and download your monthly payslips",
            "promoText": "Access your payslips anytime, anywhere",
            "appId": "payslip-viewer",
            "iconUrl": "http://localhost:9090/icons/payslip-viewer.png",
            "bannerImageUrl": "http://localhost:9090/banners/payslip-viewer.png",
            "isMandatory": 0,
            "versions": [
                {
                    "version": "1.0.0",
                    "build": 1,
                    "releaseNotes": "Initial release of Payslip Viewer",
                    "iconUrl": "http://localhost:9090/icons/payslip-viewer.png",
                    "downloadUrl": "http://localhost:9090/micro-apps/payslip-viewer/download"
                }
            ]
        }
    ];
}
// service / on new http:Listener(serverPort) {
//     resource function get health() returns string {
//         return "ok";
//     }
// }

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

service http:InterceptableService / on new http:Listener(serverPort, config = {requestLimits: {maxHeaderSize}}) {

    # + return - ErrorInterceptor
    public function createInterceptors() returns http:Interceptor[] =>
    [new ErrorInterceptor()];

    # Fetch user information of the logged in users (mock version).
    #
    # + ctx - Request context
    # + email - Email of the user to retrieve (query parameter for mock)
    # + return - User information object or an error
    resource function get user\-info(http:RequestContext ctx, string? email) returns MockEmployee|http:InternalServerError|http:NotFound {
        string userEmail = email ?: "mockuser@gov.com"; // Default to mock user if no email provided
        
        MockEmployee[] employees = getMockEmployees();
        foreach MockEmployee employee in employees {
            if employee.workEmail == userEmail {
                log:printInfo("Found employee: " + employee.toString());
                return employee;
            }
        }
        
        return <http:NotFound>{
            body: { message: "User not found for email: " + userEmail }
        };
    }

    
    // Get all mock employees (for testing)
    resource function get users/mock(http:RequestContext ctx) returns MockEmployee[] {
        return getMockEmployees();
    }


    // Get a single mock employee by email
    resource function get users/mock/[string email](http:RequestContext ctx) returns MockEmployee|http:NotFound {
        MockEmployee[] employees = getMockEmployees();
        foreach MockEmployee employee in employees {
            if employee.workEmail == email {
                log:printInfo("Found employee: " + employee.toString());
                return employee;
            }
        }
        return <http:NotFound>{
            body: { message: "User not found for email: " + email }
        };
    }


    // Mock micro-apps endpoint
    resource function get micro\-apps(http:RequestContext ctx) returns MockMicroApp[] {
        log:printInfo("Fetching mock micro apps");
        return getMockMicroApps();
    }


    // Mock micro-app by appId endpoint
    resource function get micro\-apps/[string appId](http:RequestContext ctx) returns MockMicroApp|http:NotFound {
        MockMicroApp[] microApps = getMockMicroApps();
        foreach MockMicroApp app in microApps {
            if app.appId == appId {
                log:printInfo("Found micro app: " + app.toString());
                return app;
            }
        }
        return <http:NotFound>{
            body: { message: "Micro app not found for app ID: " + appId }
        };
    }


    // Download microapp zip file
    resource function get micro\-apps/[string appId]/download(http:RequestContext ctx) returns http:Response|http:NotFound|http:InternalServerError {
        string zipFileName = appId + ".zip";
        string zipFilePath = "./microapps_store/" + zipFileName;
        
        log:printInfo("Attempting to download microapp: " + appId);
        log:printInfo("Looking for file: " + zipFilePath);
        
        // Try to read file content to check if it exists
        byte[]|io:Error fileContent = io:fileReadBytes(zipFilePath);
        if fileContent is io:Error {
            log:printError("Zip file not found or error reading: " + zipFilePath, fileContent);
            return <http:NotFound>{
                body: { message: "Microapp zip file not found for app ID: " + appId }
            };
        }
        
        // Create response with zip file
        http:Response response = new;
        response.setBinaryPayload(fileContent);
        error? contentTypeResult = response.setContentType("application/zip");
        if contentTypeResult is error {
            log:printError("Error setting content type", contentTypeResult);
        }
        
        error? headerResult = response.setHeader("Content-Disposition", "attachment; filename=\"" + zipFileName + "\"");
        if headerResult is error {
            log:printError("Error setting header", headerResult);
        }
        
        log:printInfo("Successfully serving zip file: " + zipFileName);
        return response;
    }


    // Serve static icons (placeholder endpoint)
    resource function get icons/[string iconName](http:RequestContext ctx) returns http:Response|http:NotFound {
        // For now, return a placeholder response
        // In a real implementation, you would serve actual icon files
        http:Response response = new;
        response.setTextPayload("Icon placeholder for: " + iconName);
        error? contentTypeResult = response.setContentType("text/plain");
        if contentTypeResult is error {
            log:printError("Error setting content type", contentTypeResult);
        }
        return response;
    }


    // Serve static banners (placeholder endpoint)
    resource function get banners/[string bannerName](http:RequestContext ctx) returns http:Response|http:NotFound {
        // For now, return a placeholder response
        // In a real implementation, you would serve actual banner files
        http:Response response = new;
        response.setTextPayload("Banner placeholder for: " + bannerName);
        error? contentTypeResult = response.setContentType("text/plain");
        if contentTypeResult is error {
            log:printError("Error setting content type", contentTypeResult);
        }
        return response;
    }


}