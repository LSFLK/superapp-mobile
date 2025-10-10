import ballerina/file;
import ballerina/io;
import ballerina/time;

isolated function checkLogFile() returns error? {
    if file:test(LOG_FILE_PATH, file:EXISTS) is error {
        check io:fileWriteString(LOG_FILE_PATH, "---- Runtime Log Started ----\n\n");
    }
}

isolated function createLogEntry(LogRecord logRecord) returns string {
    string currentTime = time:utcToString((time:utcNow()));
    string logEntry = string `[${currentTime}] [${logRecord.level}] ${logRecord.message} `;
    if logRecord.context != null {
        logEntry = logEntry + string `| Context: ${logRecord.context.toString()}`;
    }
    return logEntry;
}
