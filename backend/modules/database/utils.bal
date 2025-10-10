import ballerina/sql;

public isolated function checkDatabaseHealth() returns boolean {
    sql:ParameterizedQuery healthQuery = getHealthCheckQuery();
    stream<record {|int value;|}, sql:Error?> resultStream = databaseClient->query(healthQuery);
    record {|record {|int value;|} value;|}|sql:Error? result = resultStream.next();
    error? closeError = resultStream.close();
    
    if result is sql:Error || closeError is error {
        return false;
    }
    return true;
}

public isolated function validateDatabaseConnection() returns error? {
    boolean isHealthy = checkDatabaseHealth();
    if !isHealthy {
        return error("Database connection validation failed");
    }
}

public function stopHandler() returns error? {
    check databaseClient.close();
}
