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

# Token request record type.
public type TokenRequest record {|
    # Client/MicroApp identifier (must not be empty)
    @constraint:String {
        minLength: 1
    }
    string clientId;
|};

# Token response record type.
public type TokenResponse record {|
    # Issued token
    string token;
    # Token expiration time in seconds
    decimal expiresAt;
|};

# JSON Web Key (JWK) record type for RSA keys.
public type JsonWebKey record {|
    # Key type (e.g., "RSA")
    string kty;
    # Public key use (e.g., "sig" for signature)
    string use;
    # Key ID to match the kid in JWT header
    string kid;
    # Modulus (base64url-encoded)
    string n;
    # Exponent (base64url-encoded)
    string e;
|};

# JSON Web Key Set (JWKS) record type.
public type JsonWebKeySet record {|
    # Array of JSON Web Keys
    JsonWebKey[] keys;
|};
