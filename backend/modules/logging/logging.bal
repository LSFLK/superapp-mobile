import ballerina/io;
import ballerina/log;

public isolated function log(LogRecord logRecord) {
    boolean|error? result = checkLogFile();
    if result is error {
        log:printError("[logging] Something went wrong while checking log file", result);
        return;
    }
    
    string logEntry = createLogEntry(logRecord);
    result = saveLogRecord(logEntry);
    if result is error {
        log:printError("[logging] Something went wrong while saving log record", result);
    }

}

isolated function saveLogRecord(string logEntry) returns error? {
    // save log entry to file
    boolean|error? result = io:fileWriteString(LOG_FILE_PATH, logEntry + "\n", "APPEND");
    if result is error {
        return error("Cannot write to file", message = result);
    }
}
