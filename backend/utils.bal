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
import ballerina/cache;
import ballerina/log;

final cache:Cache userInfoCache = new (capacity = 100, evictionFactor = 0.2);

# Retrieves basic user information for a given email.
#
# + email - Email address of the user
# + return - database:User record if available, or error? if an error occurs or the user is not found
public function getUserInfo(string email) returns User|error? {

    if userInfoCache.hasKey(email) {
        User|error loggedInUser = userInfoCache.get(email).ensureType();
        if loggedInUser is error {
            log:printWarn(string `Error occurred while retrieving user data: ${email}!`, loggedInUser);
        } else {
            return loggedInUser;
        }
    }
    return userInfoService.getUserInfoByEmail(email);
}