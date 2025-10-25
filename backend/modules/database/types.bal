// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.
import ballerina/constraint;
import ballerina/sql;
import ballerinax/mysql;

# [Configurable] Superapp mobile database configs.
type DatabaseConfig record {|
    # Database hostname
    string host;
    # Database username
    string user;
    # Database password
    string password;
    # Database name
    string database;
    # Database port
    int port = 3306;
    # SQL Connection Pool configurations
    ConnectionPool connectionPool;
|};

# mysql:Client database config record.
type SuperappMobileDatabaseConfig record {|
    *DatabaseConfig;
    # Additional configurations related to the MySQL database connection
    mysql:Options? options;
|};

# mysql:ConnectionPool parameter record with default optimized values 
type ConnectionPool record {|
    # The maximum open connections
    int maxOpenConnections = 10;
    # The maximum lifetime of a connection in seconds
    decimal maxConnectionLifeTime = 180;
    # The minimum idle connections in the pool
    int minIdleConnections = 5;
|};

# Record type to store the MicroApp ID during DB operations/DB Streams.
public type MicroAppId record {|
    # ID of the microapp
    string appId;
|};

# Record type to represent Microapp.
public type MicroApp record {|
    # Display Name
    string name;
    # Description
    string description;
    # Promotional text for the microapp
    @sql:Column {name: "promo_text"}
    string promoText;
    # Unique id for the microapp, example : com.wso2.supperapp.leaveapp
    @sql:Column {name: "micro_app_id"}
    @constraint:String {minLength: 1}
    string appId;
    # Display icon, in png format: 128x128
    @sql:Column {name: "icon_url"}
    string iconUrl;
    # Poster image, used in the mobile app store
    @sql:Column {name: "banner_image_url"}
    string bannerImageUrl;
    # If the microapp is mandatory to install or not, 1 - mandatory, 0 - optional
    @sql:Column {name: "mandatory"}
    int isMandatory;
    # List of versions available for the microapp
    MicroAppVersion[] versions = [];
    # List of roles/groups that have access to the microapp
    MicroAppRole[] roles = [];
|};

# Record type to represent a role/group mapping for a MicroApp.
public type MicroAppRole record {|
    # Role/group name that has access to the microapp
    @constraint:String {minLength: 1}
    string role;
|};

# Record type to represent each MicroApp versions.
public type MicroAppVersion record {|
    # Version
    @constraint:String {minLength: 1}
    string version;
    # Unique build number
    @constraint:Int {minValue: 1}
    int build;
    # Release notes
    @sql:Column {name: "release_notes"}
    string releaseNotes;
    # Icon url
    @sql:Column {name: "icon_url"}
    string iconUrl;
    # Download url
    @sql:Column {name: "download_url"}
    string downloadUrl;
|};

# Record type to model Version of the SuperApp.
public type Version record {|
    # Version
    string version;
    # Unique build number
    int build;
    # Platform, ios or android
    string platform;
    # Release notes
    @sql:Column {name: "release_notes"}
    string releaseNotes;
    # Download url
    @sql:Column {name: "download_url"}
    string downloadUrl;
|};

# Record type to model basic user information.
public type User record {
    # Email of the user
    string workEmail;
    # First name of the user
    string firstName;
    # Last name of the user
    string lastName;
    # Thumbnail of the user
    string? userThumbnail;
    # Location of the user
    string? location;
};

# Record type for bulk user creation request.
public type BulkUserRequest record {
    # Array of users to create/update
    User[] users;
};

# Record type to model configurations for the users of the SuperApp.
public type AppConfig record {|
    # User email
    string email;
    # Configuration key, unique key for the configuration
    @sql:Column {name: "config_key"}
    string configKey;
    # Configuration value, in a json format
    @sql:Column {name: "config_value"}
    json configValue;
    # Status of the configuration
    @sql:Column {name: "active"}
    int isActive;
|};

# Success API response for the Database update or create operations.
public type ExecutionSuccessResult record {|
    # Number of rows affected by the operation
    int? affectedRowCount;
    # ID of the last inserted row or sequence value
    string|int? lastInsertId?;
    # Unique id for the operation
    string uniqueId?;
|};
