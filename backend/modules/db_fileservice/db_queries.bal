// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file_service to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file_service except
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

import ballerina/sql;

# Create table query.
# 
# + return - sql:ParameterizedQuery
isolated function createMicroAppsTableQuery() returns sql:ParameterizedQuery => `
    CREATE TABLE IF NOT EXISTS micro_apps_storage (
        file_name VARCHAR(255) PRIMARY KEY,
        blob_content MEDIUMBLOB NOT NULL
    );
`;

# Upsert MicroAppFile query.
#
# + microAppFile - MicroAppFile record
# + return - sql:ParameterizedQuery
isolated function upsertMicroAppFileQuery(MicroAppFile microAppFile) returns sql:ParameterizedQuery => `
    INSERT INTO micro_apps_storage (file_name, blob_content)
    VALUES (${microAppFile.fileName}, ${microAppFile.blobContent})
    ON DUPLICATE KEY UPDATE
        blob_content = VALUES(blob_content);
`;

isolated function deleteMicroAppFileByNameQuery(string fileName) returns sql:ParameterizedQuery => `
    DELETE FROM micro_apps_storage
    WHERE file_name = ${fileName};
`;

# Get micro app blob content by file name query.
#
# + fileName - The unique file name of the MicroAppFile
# + return - sql:ParameterizedQuery
isolated function getMicroAppBlobContentByNameQuery(string fileName) returns sql:ParameterizedQuery => `
    SELECT blob_content
    FROM micro_apps_storage
    WHERE file_name = ${fileName};
`;
