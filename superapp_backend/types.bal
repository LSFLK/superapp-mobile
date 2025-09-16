type ConnectionPool record {|
    int maxOpenConnections = 10;
    decimal maxConnectionLifeTime = 180;
    int minIdleConnections = 5;
|};

type DatabaseConfig record {|
    string host;
    string user;
    string password;
    string database;
    int port;
    ConnectionPool connectionPool?;
|};