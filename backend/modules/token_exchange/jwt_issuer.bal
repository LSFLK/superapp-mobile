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

import ballerina/jwt;
import ballerina/uuid;

# Issues a JWT for the given user and microapp identifiers.
#
# + userId - The identifier of the user for whom the token is issued
# + microAppId - The unique identifier for the microapp
# + groups - Optional list of group identifiers associated with the user
# + return - JWT token string or error if token generation fails
public isolated function issueJWT(string userId, string microAppId, string[]? groups) returns string|error {
    string hashedMicroAppId = getHashedMicroAppId(microAppId);
    map<json> claims = {
        "groups": groups,
        "email": userId,
        "jti": uuid:createType1AsString()
    };

    jwt:IssuerConfig issuerConfig = {
        issuer: SUPERAPP_ISSUER,
        audience: hashedMicroAppId,
        keyId: KEY_ID,
        expTime: tokenTTLSeconds,
        customClaims: claims,
        signatureConfig: {
            config: {
                keyFile: privateKeyPath
            }
        }
    };

    string token = check jwt:issue(issuerConfig);
    return token;
}
