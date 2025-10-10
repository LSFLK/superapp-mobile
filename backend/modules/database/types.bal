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

public type User record {
    int user_id;
    string first_name;
    string last_name;
    string email;
    json? downloaded_app_ids;
};

public type MicroApp record {
    string app_id;
    string name;
    string version;
    byte[]? icon_url;
    int? zip_blob_length;   // size in bytes
    string? created_at;  
    string download_url;
    string? description;
};

public type MicroAppDownload record {
    byte[] zip_blob;
};

public type MicroAppIcon record {
    byte[] icon_url;
};