import ballerina/crypto;
import ballerina/log;

configurable string privateKeyForSigningPath = ?;

// -------------------------
// Generate manifest
// -------------------------
isolated function generateManifest(byte[] zipBlob, string[]? allowedFunctions) returns json {
    string[] allowed_functions = allowedFunctions is null? AVAILABLE_FUNCTIONS : allowedFunctions;
    return {
        "sha256": (crypto:hashSha256(zipBlob)).toBase64(),
        "size": zipBlob.length(),
        "allowed_functions": allowed_functions
    };
}


// -------------------------
// Sign manifest
// -------------------------
isolated function signManifest(json manifest) returns string|error {
    
    crypto:PrivateKey privateKeyForSigning = check crypto:decodeRsaPrivateKeyFromKeyFile(privateKeyForSigningPath);

    byte[] manifestDataBytes = manifest.toString().toBytes();

    byte[] signature = check crypto:signRsaSha256(manifestDataBytes, privateKeyForSigning);
    log:printInfo(`ZIP data signed successfully. Signature: ${signature.toBase64()}`);

    return signature.toBase64();
}


// -------------------------
// Wrap manifest + signature
// -------------------------
isolated function wrapManifest(json manifest, string signatureB64) returns string {
    return {
        "manifest": manifest,
        "signature": signatureB64
    }.toString();
}


public isolated function createSignedManifest(
        byte[] zipData,
        string[]? allowedFunctions
    ) returns string|error {

    // Generate manifest
    json manifest = generateManifest(zipData, allowedFunctions);

    // Sign manifest
    string signature = check signManifest(manifest);

    // Wrap manifest + signature
    string signedManifest = wrapManifest(manifest, signature);
    log:printInfo("Signed manifest created successfully: " + signedManifest);

    // Return final signed manifest as a JSON string
    return signedManifest;
}


