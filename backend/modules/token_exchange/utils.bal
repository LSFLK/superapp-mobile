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

import ballerina/crypto;
import ballerina/io;

configurable decimal tokenTTLSeconds = 300.0; // Default 5 minutes
configurable string privateKeyPath = "modules/token_exchange/private_key.pem";

# Get the hashed client ID.
#
# + clientId - Client ID to be hashed
# + return - Hashed client ID
public isolated function getHashedClientId(string clientId) returns string {
    byte[] data = clientId.toBytes();
    byte[] hash = crypto:hashSha256(data);
    return hash.toBase64();
}

# Get the configured token TTL in seconds.
#
# + return - Token time-to-live in seconds
public isolated function getTokenTTL() returns decimal {
    return tokenTTLSeconds;
}

# Get the JSON Web Key Set (JWKS) for token verification.
# Reads from jwks.json file and populates the key store.
#
# + return - JsonWebKeySet containing all registered public keys or error
public isolated function getJWKS() returns JsonWebKeySet|error {
    JsonWebKey[] jwkStore = [];
    json jwksJson = check io:fileReadJson(JWKS_FILE_PATH);
    JsonWebKeySet jwksData = check jwksJson.cloneWithType(JsonWebKeySet);

    foreach JsonWebKey key in jwksData.keys {
        jwkStore.push(key);
    }

    return {keys: jwkStore.cloneReadOnly()};
}
