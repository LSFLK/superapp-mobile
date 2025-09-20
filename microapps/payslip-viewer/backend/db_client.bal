import ballerinax/mysql;
import ballerinax/mysql.driver as _; // bundle driver

configurable DatabaseConfig databaseConfig = ?;

// Singleton MySQL client used across modules
public mysql:Client db = check new(
    host = databaseConfig.DB_HOST,
    port = databaseConfig.DB_PORT,
    user = databaseConfig.DB_USER,
    password = databaseConfig.DB_PASSWORD,
    database = databaseConfig.DB_NAME
);
