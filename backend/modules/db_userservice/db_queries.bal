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

# Query to get all users from `users_` table.
#
# + return - Generated query to get all users
isolated function getAllUsersQuery() returns sql:ParameterizedQuery => `
    SELECT
        email as workEmail,
        firstName,
        lastName,
        userThumbnail,
        location
    FROM
        users_
    ORDER BY
        firstName, lastName
`;

# Query to get user information by email.
#
# + email - User email
# + return - Generated query to get user information
isolated function getUserInfoByEmailQuery(string email) returns sql:ParameterizedQuery => `
    SELECT
        email as workEmail,
        firstName,
        lastName,
        userThumbnail,
        location
    FROM
        users_
    WHERE
        email = ${email}
`;

# Query to insert/update a new user into `users_` table.
#
# + email - User email
# + firstName - User's first name
# + lastName - User's last name
# + userThumbnail - URL to user's profile picture
# + location - User's location
# + return - Generated query to insert/update a new user
isolated function upsertUserInfoQuery(string email, string firstName, string lastName,
        string userThumbnail, string location) returns sql:ParameterizedQuery => `
    INSERT INTO users_ (
        email,
        firstName,
        lastName,
        userThumbnail,
        location
    ) VALUES (
        ${email},
        ${firstName},
        ${lastName},
        ${userThumbnail},
        ${location}
    )
    ON DUPLICATE KEY UPDATE
        firstName = ${firstName},
        lastName = ${lastName},
        userThumbnail = ${userThumbnail},
        location = ${location}
`;

# Query to delete a user from `users_` table.
#
# + email - User's email address
# + return - Generated query to delete a user
isolated function deleteUserQuery(string email) returns sql:ParameterizedQuery => `
    DELETE FROM users_
    WHERE email = ${email}
`;
