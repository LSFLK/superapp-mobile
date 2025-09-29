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

type User record {
    int user_id;
    string first_name;
    string last_name;
    string email;
    string employee_id;
    string department;
    json? downloaded_app_ids;
};

// Record for micro_app
type MicroApp record {
    int micro_app_id;
    string app_id;
    string name;
    string version;
    byte[]? icon_url;
    int? zip_blob_length;   // size in bytes
    string? created_at;     // timestamp as string
    string download_url;
    string? description;
};

// MicroAppDownload type for fetching ZIP blob
type MicroAppDownload record {
    byte[] zip_blob;
};

// MicroAppIcon type for fetching icon blob
type MicroAppIcon record {
    byte[] icon_url;
};