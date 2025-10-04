import ballerina/log;

// Centralized log function
public isolated function createLog(string level, string message, map<int|string|string[]|int[]>? context) {

    // Merge timestamp with context
    map<int|string|string[]|int[]>? logData = context.clone();

    // Decide log level
    if level == "INFO" {
        log:printInfo(message, keyValuePairs = logData);
    } else if level == "WARN"{
        log:printWarn(message, keyValuePairs = logData);
    } else if level == "ERROR" {
        log:printError(message, keyValuePairs = logData);
    }
}