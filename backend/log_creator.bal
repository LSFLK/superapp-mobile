import ballerina/log;
import ballerina/io;
import ballerina/file;
import ballerina/time;

final string LOG_FILE_PATH = "./runtime.log";

isolated function ensureLogFile() returns error? {

    if file:test(LOG_FILE_PATH, file:EXISTS) is error {
        check io:fileWriteString(LOG_FILE_PATH, "---- Runtime Log Started ----\n\n");
    }
}

// Centralized log function
public isolated function createLog(LogRecord logRecord) {

    // Logging in a temporary file
    boolean|error? result_ = ensureLogFile();
    if result_ is error {
        log:printError("File cannot be resolved");
    }

    string currentTime = time:utcToString((time:utcNow()));

    string contextString = logRecord.context.toString();

    string logEntry = string `[${currentTime}] [${logRecord.level}] ${logRecord.message} `;
    if logRecord.context != null {
        logEntry = logEntry + string `| Context: ${contextString}`;
    }
    
    boolean|error? result = io:fileWriteString(LOG_FILE_PATH, logEntry+"\n", "APPEND");
    
    if result is error {
        log:printError("Cannot write to file");
    }

}