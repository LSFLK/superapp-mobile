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

# Query to retrieve distinct micro app IDs allowed for the given user groups.
#
# + groups - An array of user groups used to filter allowed micro apps
# + return - sql:ParameterizedQuery to retrieve the list of allowed micro app IDs
isolated function getMicroAppIdsAllowedForGroups(string[] groups) returns sql:ParameterizedQuery => sql:queryConcat(`
    SELECT DISTINCT
        micro_app_id as appId
    FROM
        micro_app_role
    WHERE
        active = 1
    AND role IN (`, sql:arrayFlattenQuery(groups), `)
`);

# Query to get all MicroApps allowed for given groups.
#
# + appIds - MicroApp Ids
# + return - Generated Query to get all MicroApps
isolated function getMicroAppsByAppIdsQuery(string[] appIds) returns sql:ParameterizedQuery => sql:queryConcat(`
    SELECT
        name,
        description,
        promo_text,
        micro_app_id,
        icon_url,
        banner_image_url,
        mandatory
    FROM
        micro_app 
    WHERE
        active = 1
    AND 
        micro_app_id IN (`, sql:arrayFlattenQuery(appIds), `)
`);

# Query to get MicroApp versions by appId.
#
# + appId - MicroApp Id
# + return - Generated Query to get MicroApp versions
isolated function getAllMicroAppVersionsQuery(string appId) returns sql:ParameterizedQuery => `
    SELECT
        version,
        build,
        release_notes,
        icon_url,
        download_url
    FROM
        micro_app_version
    WHERE
        micro_app_id = ${appId}
    AND
        active = 1
    ORDER BY
        build DESC
`;

# Query to get MicroApp by appId.
#
# + appId - MicroApp Id
# + return - Generated Query to get MicroApp by appId
isolated function getMicroAppByIdQuery(string appId) returns sql:ParameterizedQuery => `
    SELECT
        name,
        description,
        promo_text,
        micro_app_id,
        icon_url,
        banner_image_url,
        mandatory
    FROM
        micro_app 
    WHERE
        micro_app_id = ${appId}
    AND
        active = 1
`;

# Query to get SuperApp versions by platform
#
# + platform - Platform (ios or android)
# + return - Generated Query to get SuperApp versions
isolated function getSuperAppVersionsByPlatformQuery(string platform) returns sql:ParameterizedQuery => `
    SELECT
        version,
        build,
        platform,
        release_notes,
        download_url
    FROM
        superapp_version
    WHERE
        platform = ${platform}
    AND
        active = 1
    ORDER BY
        build DESC
`;

# Query to configurations by email
#
# + email - User email
# + return - Generated Query to get configurations by email
isolated function getUserConfigurationsByEmailQuery(string email) returns sql:ParameterizedQuery => `
    SELECT
        email,
        config_key,
        config_value,
        active
    FROM
        user_config
    WHERE
        email = ${email}
    AND
        active = 1
`;

# Query update configurations by email
#
# + email - User email
# + configKey - Configuration key
# + configValue - Configuration value
# + isActive - status 1 or 0
# + return - Generated Query to insert/update configurations
isolated function updateUserConfigurationsQuery(string email, string configKey, string configValue, int isActive)
    returns sql:ParameterizedQuery => `
        INSERT INTO user_config (
            email,
            config_key,
            config_value,
            created_by,
            updated_by,
            active
        )
        VALUES (
            ${email},
            ${configKey},
            ${configValue},
            ${email},
            ${email},
            ${isActive}
        )
        ON DUPLICATE KEY UPDATE
            updated_by = ${email},
            config_value = ${configValue},
            active = ${isActive}
`;
