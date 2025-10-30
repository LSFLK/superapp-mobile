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
import ballerinax/mysql;
import ballerina/constraint;
import ballerina/sql;

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

# Record type to represent Microapp.
public type MicroAppFile record {|
    # File name (unique)
    @sql:Column {name: "file_name"}
    @constraint:String {minLength: 1}
    string fileName;
    # Blob content
    @sql:Column {name: "blob_content"}
    byte[] blobContent;
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
