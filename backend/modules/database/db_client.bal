import ballerinax/mysql;
import ballerinax/mysql.driver as _;

type SuperappMobileDatabaseConfig record {|
    *DatabaseConfig;
    mysql:Options? options;
|};

configurable DatabaseConfig databaseConfig = ?;
configurable string superappBaseUrl = ?;

SuperappMobileDatabaseConfig superappMobileDatabaseConfig = {
    ...databaseConfig,
    options: {
        ssl: {mode: mysql:SSL_PREFERRED},
        connectTimeout: 10, // 10 seconds
        socketTimeout: 30, // 30 seconds

        // Disable autocommit for transaction control
        useXADatasource: false
    }
};
final mysql:Client databaseClient = check new (...superappMobileDatabaseConfig);