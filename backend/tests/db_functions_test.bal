import ballerina/test;

import superapp_backend.database;

// Integration-style test for `insertMicroAppWithZip`.
// NOTE: This test expects the following configurable values to be set in the Ballerina runtime
// environment (via `ballerina.conf` / environment variables or other config mechanism):
// - `privateKeyForSigningPath` (used by the signing routine in `modules/auth`)
// - `databaseConfig` (DB connection details used by the mysql client in db_client.bal)
// If these are not configured, the test will fail with configuration/crypto/database errors.

@test:Config
public function testInsertMicroAppWithZip() returns error? {
    // Minimal sample inputs. You can replace these with more realistic values when running locally.
    string name = "test-micro-app";
    string version = "0.0.1-test";
    // Use small byte array as placeholder ZIP data. A real ZIP blob may be used instead.
    byte[] zipData = "dummy-zip-data".toBytes();
    string appId = "test-app-id-" + name;
    string iconUrlPath = "";
    string description = "Test micro app inserted by automated test";
    string[]? allowedFunctions = ["read", "write"];

    // Call the function under test. Using `check` will fail the test if an error is returned.
    check database:insertMicroAppWithZip(name, version, zipData, appId, iconUrlPath, description, allowedFunctions);

    // If we reach here, insertion didn't return an error.
    test:assertTrue(true, msg = "insertMicroAppWithZip executed without returning an error");
}

// 
