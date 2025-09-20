import ballerinax/mysql;
import ballerinax/mysql.driver as _;

type SuperappMobileDatabaseConfig record {|
    *DatabaseConfig;
    mysql:Options? options;
|};


// Databse Connection Configuration

configurable DatabaseConfig databaseConfig = ?;

SuperappMobileDatabaseConfig superappMobileDatabaseConfig = {
    ...databaseConfig,
    options: {
        ssl: { mode: mysql:SSL_PREFERRED },
        connectTimeout: 10
    }
};


// Database client configuration
final mysql:Client databaseClient = check new (...superappMobileDatabaseConfig);