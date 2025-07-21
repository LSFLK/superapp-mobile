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
import ballerina/http;

# SuperApp Internal Server Error
#
# + body - SuperAppServerMessage
public type SuperAppServerError record {|
    *http:InternalServerError;
    SuperAppServerMessage body;
|};

# SuperApp Not Found Error
#
# + body - SuperAppServerMessage
public type SuperAppNotFoundError record {|
    *http:NotFound;
    SuperAppServerMessage body;
|};

# SuperApp Server Message
#
# + message - Human readable error message
public type SuperAppServerMessage record {|
    string message;
|};
