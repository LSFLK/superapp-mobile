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

# Azure Blob Service Configuration.
#
# + accountName - Azure Storage account name
# + accessKey - Azure Storage account access key
# + containerName - Azure Blob container name
public type AzureBlobServiceConfig record {|
    string accountName;
    string accessKey;
    string containerName;
|};
