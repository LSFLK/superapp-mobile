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

import ballerina/test;
import superapp_mobile_service.database;
import superapp_mobile_service.db_userservice;
import superapp_mobile_service.db_fileservice;

const string TEST_EMAIL = "test.user@example.com";
const string TEST_APP_ID = "com.test.app";
const string TEST_ROLE = "hr-staff";
const string TEST_CREATOR = "admin@example.com";
const string TEST_FILE_NAME = "test-file.zip";

// ============================================================================
// Database Module Tests
// ============================================================================

@test:Config {
    groups: ["database", "microapp"]
}
function testUpsertAndGetMicroApp() returns error? {
    // Create a test micro app
    database:MicroApp testApp = {
        name: "Test App",
        description: "Test Description",
        promoText: "Test Promo",
        appId: TEST_APP_ID,
        iconUrl: "https://example.com/icon.png",
        bannerImageUrl: "https://example.com/banner.png",
        isMandatory: 0,
        versions: [],
        roles: [{role: TEST_ROLE}]
    };

    // Test upsert
    database:ExecutionSuccessResult|error result = database:upsertMicroApp(testApp, TEST_CREATOR);
    test:assertTrue(result is database:ExecutionSuccessResult, "Upsert MicroApp should succeed");

    // Test get by ID
    database:MicroApp?|error retrievedApp = database:getMicroAppById(TEST_APP_ID, [TEST_ROLE]);
    test:assertTrue(retrievedApp is database:MicroApp, "Get MicroApp by ID should return a MicroApp");
    
    if retrievedApp is database:MicroApp {
        test:assertEquals(retrievedApp.appId, TEST_APP_ID, "Retrieved app ID should match");
        test:assertEquals(retrievedApp.name, "Test App", "Retrieved app name should match");
    }

    // Test get all micro apps
    database:MicroApp[]|error allApps = database:getMicroApps([TEST_ROLE]);
    test:assertTrue(allApps is database:MicroApp[], "Get all MicroApps should return an array");
    
    if allApps is database:MicroApp[] {
        test:assertTrue(allApps.length() > 0, "Should have at least one micro app");
    }
}

@test:Config {
    groups: ["database", "microapp", "version"],
    dependsOn: [testUpsertAndGetMicroApp]
}
function testUpsertMicroAppVersion() returns error? {
    database:MicroAppVersion testVersion = {
        version: "1.0.0",
        build: 1,
        releaseNotes: "Initial release",
        iconUrl: "https://example.com/v1-icon.png",
        downloadUrl: "https://example.com/download/v1.zip"
    };

    database:ExecutionSuccessResult|error result = 
        database:upsertMicroAppVersion(TEST_APP_ID, testVersion, TEST_CREATOR);
    
    test:assertTrue(result is database:ExecutionSuccessResult, "Upsert MicroApp version should succeed");

    // Verify version was added
    database:MicroApp?|error app = database:getMicroAppById(TEST_APP_ID, [TEST_ROLE]);
    if app is database:MicroApp {
        test:assertTrue(app.versions.length() > 0, "Should have at least one version");
        test:assertEquals(app.versions[0].version, "1.0.0", "Version number should match");
    }
}

@test:Config {
    groups: ["database", "microapp", "role"],
    dependsOn: [testUpsertAndGetMicroApp]
}
function testUpsertMicroAppRole() returns error? {
    database:MicroAppRole testRole = {
        role: "default"
    };

    database:ExecutionSuccessResult|error result = 
        database:upsertMicroAppRole(TEST_APP_ID, testRole, TEST_CREATOR);
    
    test:assertTrue(result is database:ExecutionSuccessResult, "Upsert MicroApp role should succeed");

    // Verify the app is accessible with new role
    database:MicroApp?|error app = database:getMicroAppById(TEST_APP_ID, ["default"]);
    test:assertTrue(app is database:MicroApp, "App should be accessible with new role");
}

@test:Config {
    groups: ["database", "microapp", "version"]
}
function testGetVersionsByPlatform() returns error? {
    database:Version[]|error versions = database:getVersionsByPlatform("android");
    test:assertTrue(versions is database:Version[], "Get versions should return an array");
    // Note: Array may be empty if no versions exist in database
}

@test:Config {
    groups: ["database", "config"]
}
function testAppConfigs() returns error? {
    database:AppConfig testConfig = {
        email: TEST_EMAIL,
        configKey: "downloaded_apps",
        configValue: {"apps": ["app1", "app2"]},
        isActive: 1
    };

    // Test update config
    database:ExecutionSuccessResult|error updateResult = 
        database:updateAppConfigsByEmail(TEST_EMAIL, testConfig);
    test:assertTrue(updateResult is database:ExecutionSuccessResult, "Update app config should succeed");

    // Test get configs
    database:AppConfig[]|error configs = database:getAppConfigsByEmail(TEST_EMAIL);
    test:assertTrue(configs is database:AppConfig[], "Get app configs should return an array");
    
    if configs is database:AppConfig[] {
        test:assertTrue(configs.length() > 0, "Should have at least one config");
    }
}

@test:Config {
    groups: ["database", "microapp", "deactivate"],
    dependsOn: [testUpsertMicroAppVersion, testUpsertMicroAppRole]
}
function testDeactivateMicroApp() returns error? {
    database:ExecutionSuccessResult|error result = 
        database:deactivateMicroApp(TEST_APP_ID, TEST_CREATOR);
    
    test:assertTrue(result is database:ExecutionSuccessResult, "Deactivate MicroApp should succeed");

    // Verify app is no longer accessible
    database:MicroApp?|error app = database:getMicroAppById(TEST_APP_ID, [TEST_ROLE]);
    test:assertTrue(app is (), "Deactivated app should not be retrievable");
}

// ============================================================================
// User Service Module Tests
// ============================================================================

@test:Config {
    groups: ["userservice", "user"]
}
function testUpsertAndGetUser() returns error? {
    db_userservice:User testUser = {
        workEmail: TEST_EMAIL,
        firstName: "Test",
        lastName: "User",
        userThumbnail: "https://example.com/avatar.png",
        location: "Sri Lanka"
    };

    // Test upsert user
    error? upsertResult = db_userservice:upsertUserInfo(testUser);
    test:assertTrue(upsertResult is (), "Upsert user should succeed");

    // Test get user by email
    db_userservice:User|error? retrievedUser = db_userservice:getUserInfoByEmail(TEST_EMAIL);
    test:assertTrue(retrievedUser is db_userservice:User, "Get user by email should return a User");
    
    if retrievedUser is db_userservice:User {
        test:assertEquals(retrievedUser.workEmail, TEST_EMAIL, "User email should match");
        test:assertEquals(retrievedUser.firstName, "Test", "User first name should match");
        test:assertEquals(retrievedUser.lastName, "User", "User last name should match");
    }

    // Test get all users
    db_userservice:User[]|error allUsers = db_userservice:getAllUsers();
    test:assertTrue(allUsers is db_userservice:User[], "Get all users should return an array");
    
    if allUsers is db_userservice:User[] {
        test:assertTrue(allUsers.length() > 0, "Should have at least one user");
    }
}

@test:Config {
    groups: ["userservice", "user", "bulk"]
}
function testUpsertBulkUsers() returns error? {
    db_userservice:User[] testUsers = [
        {
            workEmail: "bulk1@example.com",
            firstName: "Bulk",
            lastName: "User1",
            userThumbnail: "https://example.com/bulk1.png",
            location: "USA"
        },
        {
            workEmail: "bulk2@example.com",
            firstName: "Bulk",
            lastName: "User2",
            userThumbnail: "https://example.com/bulk2.png",
            location: "UK"
        }
    ];

    error? result = db_userservice:upsertBulkUsersInfo(testUsers);
    test:assertTrue(result is (), "Bulk upsert users should succeed");

    // Verify users were created
    db_userservice:User|error? user1 = db_userservice:getUserInfoByEmail("bulk1@example.com");
    db_userservice:User|error? user2 = db_userservice:getUserInfoByEmail("bulk2@example.com");
    
    test:assertTrue(user1 is db_userservice:User, "First bulk user should exist");
    test:assertTrue(user2 is db_userservice:User, "Second bulk user should exist");
}

@test:Config {
    groups: ["userservice", "user", "delete"],
    dependsOn: [testUpsertAndGetUser]
}
function testDeleteUser() returns error? {
    error? result = db_userservice:deleteUser(TEST_EMAIL);
    test:assertTrue(result is (), "Delete user should succeed");

    // Verify user was deleted
    db_userservice:User|error? deletedUser = db_userservice:getUserInfoByEmail(TEST_EMAIL);
    test:assertTrue(deletedUser is () || deletedUser is error, "Deleted user should not exist or return error");
}

// ============================================================================
// File Service Module Tests
// ============================================================================

@test:Config {
    groups: ["fileservice", "file"]
}
function testUpsertAndGetMicroAppFile() returns error? {
    byte[] testContent = "This is test file content".toBytes();
    
    db_fileservice:MicroAppFile testFile = {
        fileName: TEST_FILE_NAME,
        blobContent: testContent
    };

    // Test upsert file
    db_fileservice:ExecutionSuccessResult|error upsertResult = 
        db_fileservice:upsertMicroAppFile(testFile);
    test:assertTrue(upsertResult is db_fileservice:ExecutionSuccessResult, "Upsert file should succeed");

    // Test get file
    byte[]?|error retrievedContent = db_fileservice:getMicroAppBlobContentByName(TEST_FILE_NAME);
    test:assertTrue(retrievedContent is byte[], "Get file should return byte array");
    
    if retrievedContent is byte[] {
        test:assertEquals(retrievedContent, testContent, "File content should match");
    }
}

@test:Config {
    groups: ["fileservice", "file", "update"],
    dependsOn: [testUpsertAndGetMicroAppFile]
}
function testUpdateMicroAppFile() returns error? {
    byte[] updatedContent = "This is updated file content".toBytes();
    
    db_fileservice:MicroAppFile updatedFile = {
        fileName: TEST_FILE_NAME,
        blobContent: updatedContent
    };

    // Test update (upsert with same filename)
    db_fileservice:ExecutionSuccessResult|error updateResult = 
        db_fileservice:upsertMicroAppFile(updatedFile);
    test:assertTrue(updateResult is db_fileservice:ExecutionSuccessResult, "Update file should succeed");

    // Test get updated file
    byte[]?|error retrievedContent = db_fileservice:getMicroAppBlobContentByName(TEST_FILE_NAME);
    test:assertTrue(retrievedContent is byte[], "Get updated file should return byte array");
    
    if retrievedContent is byte[] {
        test:assertEquals(retrievedContent, updatedContent, "Updated file content should match");
    }
}

@test:Config {
    groups: ["fileservice", "file", "delete"],
    dependsOn: [testUpdateMicroAppFile]
}
function testDeleteMicroAppFile() returns error? {
    db_fileservice:ExecutionSuccessResult|error deleteResult = 
        db_fileservice:deleteMicroAppFileByName(TEST_FILE_NAME);
    test:assertTrue(deleteResult is db_fileservice:ExecutionSuccessResult, "Delete file should succeed");

    // Verify file was deleted
    byte[]?|error deletedFile = db_fileservice:getMicroAppBlobContentByName(TEST_FILE_NAME);
    test:assertTrue(deletedFile is (), "Deleted file should not exist");
}

@test:Config {
    groups: ["fileservice", "file", "notfound"]
}
function testGetNonExistentFile() returns error? {
    byte[]?|error result = db_fileservice:getMicroAppBlobContentByName("non-existent-file.zip");
    test:assertTrue(result is (), "Non-existent file should return nil");
}

// ============================================================================
// Edge Case Tests
// ============================================================================

@test:Config {
    groups: ["database", "edgecase"]
}
function testGetMicroAppsWithEmptyGroups() returns error? {
    database:MicroApp[]|error apps = database:getMicroApps([]);
    test:assertTrue(apps is database:MicroApp[], "Should return empty array for empty groups");
    
    if apps is database:MicroApp[] {
        test:assertEquals(apps.length(), 0, "Should have zero apps for empty groups");
    }
}

@test:Config {
    groups: ["database", "edgecase"]
}
function testGetMicroAppWithNonExistentId() returns error? {
    database:MicroApp?|error app = database:getMicroAppById("non.existent.app", [TEST_ROLE]);
    test:assertTrue(app is (), "Non-existent app should return nil");
}

@test:Config {
    groups: ["userservice", "edgecase"]
}
function testGetNonExistentUser() returns error? {
    db_userservice:User|error? user = db_userservice:getUserInfoByEmail("definitely.nonexistent.user@example.com");
    test:assertTrue(user is () || user is error, "Non-existent user should return nil or error");
}

@test:Config {
    groups: ["userservice", "edgecase"]
}
function testDeleteNonExistentUser() returns error? {
    error? result = db_userservice:deleteUser("nonexistent@example.com");
    test:assertTrue(result is error, "Deleting non-existent user should return error");
}

@test:Config {
    groups: ["fileservice", "edgecase"]
}
function testDeleteNonExistentFile() returns error? {
    db_fileservice:ExecutionSuccessResult|error result = 
        db_fileservice:deleteMicroAppFileByName("nonexistent.zip");
    test:assertTrue(result is error, "Deleting non-existent file should return error");
}
