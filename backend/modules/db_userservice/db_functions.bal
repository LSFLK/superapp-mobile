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
import ballerina/sql;

# Get all users from the database.
#
# + return - Array of User records or error
public isolated function getAllUsers() returns User[]|error {
    stream<User, sql:Error?> userStream = databaseClient->query(getAllUsersQuery());
    User[] users = check from User user in userStream select user;
    check userStream.close();
    return users;
}

# Get user information by email from the database.
#
# + email - User's email address
# + return - User record or error
public isolated function getUserInfoByEmail(string email) returns User|error? {
    User|error? userInfo = check databaseClient->queryRow(getUserInfoByEmailQuery(email));
    return userInfo;
}

# Create or update user information in the database.
#
# + user - User record to create/update
# + return - ExecutionSuccessResult on success or error
public isolated function upsertUserInfo(User user) returns error? {
    
    sql:ExecutionResult result = check databaseClient->execute(
        upsertUserInfoQuery(user.workEmail, user.firstName, user.lastName, user.userThumbnail?:"", user.location?:"")
    );
    
    if result.affectedRowCount == 0 {
        return error("Failed to upsert user information.");
    }
}

# Create or update multiple users in the database.
#
# + users - Array of users to insert/update
# + return - ExecutionSuccessResult on success or error
public isolated function upsertBulkUsersInfo(User[] users) returns error? {
    error? result;    
    foreach User user in users {
        result = upsertUserInfo(user);
    }

    if result is error {
        return error("Failed to upsert bulk user information.");
    }
}

# Delete a user from the database.
#
# + email - User's email address
# + return - ExecutionSuccessResult on success or error
public isolated function deleteUser(string email) returns error? {
    sql:ExecutionResult result = check databaseClient->execute(deleteUserQuery(email));
    
    if result.affectedRowCount == 0 {
        return error("User not found or already deleted.");
    }
}
