public type LogRecord record {|
    LogLevel level;
    string message;
    string|int|string[]|int[]|map<anydata> context?;
|};

public type LogLevel "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";