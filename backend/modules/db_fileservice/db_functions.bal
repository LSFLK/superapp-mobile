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

# Upsert a MicroAppFile record in the database.
#
# + microAppFile - The MicroAppFile record to upsert
# + return - ExecutionSuccessResult on success or error
public isolated function upsertMicroAppFile(MicroAppFile microAppFile) 
    returns ExecutionSuccessResult|error {

    sql:ExecutionResult|error createTableResult = databaseClient->execute(createMicroAppsTableQuery());
    if createTableResult is error {
        return createTableResult;
    }
    
    sql:ExecutionResult result = check databaseClient->execute(upsertMicroAppFileQuery(microAppFile));
    if result.affectedRowCount == 0 {
        return error("Failed to add micro app file in the database.");
    }

    return result.cloneWithType(ExecutionSuccessResult);
}

# Delete a MicroAppFile record from the database by file name.
#
# + fileName - The unique file name of the MicroAppFile
# + return - ExecutionSuccessResult on success or error
public isolated function deleteMicroAppFileByName(string fileName) returns ExecutionSuccessResult|error {

    sql:ExecutionResult result = check databaseClient->execute(deleteMicroAppFileByNameQuery(fileName));
    if result.affectedRowCount == 0 {
        return error("No micro app file found to delete with the given file name.");
    }

    return result.cloneWithType(ExecutionSuccessResult);
}

# Get a MicroAppFile record from the database by file name.
#
# + fileName - The unique file name of the MicroAppFile
# + return - byte[] of the MicroAppFile on success or error
public isolated function getMicroAppBlobContentByName(string fileName) returns byte[]?|error {

    byte[]|error microAppBlobContent = databaseClient->queryRow(getMicroAppBlobContentByNameQuery(fileName));
    if microAppBlobContent is sql:NoRowsError {
        return;
    }

    return microAppBlobContent;
}
