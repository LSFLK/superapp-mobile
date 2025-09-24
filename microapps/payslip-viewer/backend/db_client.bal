import ballerinax/mysql;
import ballerinax/mysql.driver as _; // bundle driver

// Provides a shared database client for the application
// Config values are supplied at runtime
configurable DatabaseConfig databaseConfig = ?;

// Singleton MySQL client instance (connection pooling enabled)
final mysql:Client databaseClient = check new(
    host = databaseConfig.DB_HOST,
    port = databaseConfig.DB_PORT,
    user = databaseConfig.DB_USER,
    password = databaseConfig.DB_PASSWORD,
    database = databaseConfig.DB_NAME
);
