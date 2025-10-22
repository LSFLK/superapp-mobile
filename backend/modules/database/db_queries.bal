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
isolated function getMicroAppIdsByGroupsQuery(string[] groups) returns sql:ParameterizedQuery => sql:queryConcat(`
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
isolated function getMicroAppByAppIdQuery(string appId) returns sql:ParameterizedQuery => `
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

# Query to insert a new micro app into `micro_app` table.
#
# + microApp - The `MicroApp` record to be inserted
# + createdBy - User who performs the insertion (used for created_by/updated_by)
# + return - Generated query to insert the micro app
public isolated function upsertMicroAppQuery(MicroApp microApp, string createdBy) returns sql:ParameterizedQuery => `
    INSERT INTO micro_app (
        name,
        description,
        promo_text,
        micro_app_id,
        icon_url,
        banner_image_url,
        mandatory,
        created_by,
        updated_by,
        created_at,
        updated_at,
        active
    ) VALUES (
        ${microApp.name},
        ${microApp.description},
        ${microApp.promoText},
        ${microApp.appId},
        ${microApp.iconUrl},
        ${microApp.bannerImageUrl},
        ${microApp.isMandatory},
        ${createdBy},
        ${createdBy},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        1
    )
    ON DUPLICATE KEY UPDATE
        name = ${microApp.name},
        description = ${microApp.description},
        promo_text = ${microApp.promoText},
        icon_url = ${microApp.iconUrl},
        banner_image_url = ${microApp.bannerImageUrl},
        mandatory = ${microApp.isMandatory},
        updated_by = ${createdBy},
        updated_at = CURRENT_TIMESTAMP,
        active = 1
`;

# Query to insert a micro app version into `micro_app_version` table.
#
# + appId - MicroApp id
# + version - `MicroAppVersion` record containing version, build and URLs
# + createdBy - User who performs the insertion (used for created_by/updated_by)
# + return - Generated query to insert micro app version
public isolated function upsertMicroAppVersionQuery(string appId, MicroAppVersion version, string createdBy)
    returns sql:ParameterizedQuery => `
    INSERT INTO micro_app_version (
        version,
        build,
        release_notes,
        icon_url,
        download_url,
        micro_app_id,
        created_by,
        updated_by,
        created_at,
        updated_at,
        active
    ) VALUES (
        ${version.version},
        ${version.build},
        ${version.releaseNotes},
        ${version.iconUrl},
        ${version.downloadUrl},
        ${appId},
        ${createdBy},
        ${createdBy},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        1
    )
    ON DUPLICATE KEY UPDATE
        release_notes = ${version.releaseNotes},
        icon_url = ${version.iconUrl},
        updated_by = ${createdBy},
        updated_at = CURRENT_TIMESTAMP,
        active = 1
`;

# Query to insert a role mapping into `micro_app_role` table.
#
# + appId - MicroApp id
# + appRole - MicroAppRole record containing the role name
# + createdBy - User who performs the insertion (used for created_by/updated_by)
# + return - Generated query to insert micro app role mapping
public isolated function upsertMicroAppRoleQuery(string appId, MicroAppRole appRole, string createdBy)
    returns sql:ParameterizedQuery => `
    INSERT INTO micro_app_role (
        micro_app_id,
        role,
        active,
        created_by,
        updated_by,
        created_at,
        updated_at
    ) VALUES (
        ${appId},
        ${appRole.role},
        1,
        ${createdBy},
        ${createdBy},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON DUPLICATE KEY UPDATE
        active = 1,
        updated_by = ${createdBy},
        updated_at = CURRENT_TIMESTAMP
`;

# Query to delete (soft delete) a micro app by setting active = 0.
#
# + appId - The micro app ID to be deleted
# + updatedBy - User who performs the deletion (used for updated_by)
# + return - Generated query to soft delete the micro app from the `micro_app` table
public isolated function deleteMicroAppQuery(string appId, string updatedBy) returns sql:ParameterizedQuery =>
    `UPDATE micro_app SET 
        active = 0, 
        updated_at = CURRENT_TIMESTAMP, 
        updated_by = ${updatedBy} 
    WHERE micro_app_id = ${appId}
`;

# Query to soft delete all versions of a micro app by setting active = 0.
#
# + appId - The micro app ID whose versions should be deleted
# + updatedBy - User who performs the deletion (used for updated_by)
# + return - Generated query to soft delete all versions from the `micro_app_version` table
public isolated function deleteMicroAppVersionQuery(string appId, string updatedBy) returns sql:ParameterizedQuery =>
    `UPDATE micro_app_version SET 
        active = 0, 
        updated_at = CURRENT_TIMESTAMP, 
        updated_by = ${updatedBy} 
    WHERE micro_app_id = ${appId}
`;

# Query to soft delete all role mappings of a micro app by setting active = 0.
#
# + appId - The micro app ID whose role mappings should be deleted
# + updatedBy - User who performs the deletion (used for updated_by)
# + return - Generated query to soft delete all role mappings from the `micro_app_role` table
public isolated function deleteMicroAppRoleQuery(string appId, string updatedBy) returns sql:ParameterizedQuery =>
    `UPDATE micro_app_role SET 
        active = 0, 
        updated_at = CURRENT_TIMESTAMP, 
        updated_by = ${updatedBy} 
    WHERE micro_app_id = ${appId}
`;

# Query to get Super App versions by platform
#
# + platform - Platform (ios or android)
# + return - Generated Query to get Super App versions
isolated function getVersionsByPlatformQuery(string platform) returns sql:ParameterizedQuery => `
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

# Query to get app configurations by email
#
# + email - User email
# + return - Generated Query to get app configurations by email
isolated function getAppConfigsByEmailQuery(string email) returns sql:ParameterizedQuery => `
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
isolated function updateAppConfigsByEmailQuery(string email, string configKey, string configValue, int isActive)
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

public isolated function getUserInfoByEmailQuery(string email) returns sql:ParameterizedQuery => `
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
