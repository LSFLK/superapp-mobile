import ballerina/io;
import ballerina/regex;

// Main ZIP validation function
public isolated function validateZipFile(byte[] zipData, string filename) returns ZipValidationResult {
    // string[] errors = [];

    // 1. Basic size and signature validation
    ZipValidationResult basicResult = validateBasicZipStructure(zipData);
    if !basicResult.isValid {
        io:println("XXX Basic ZIP structure validation failed");
        return basicResult;
    }
    io:println("1) Basic ZIP structure validation passed");

    // 2. Filename validation
    ZipValidationResult filenameResult = validateZipFilename(filename);
    if !filenameResult.isValid {
        io:println("XXX Filename validation failed");
        return filenameResult;
    }
    io:println("2) Filename validation passed");

    // 3. Analyze structure for security
    ZipValidationResult structureResult = analyzeZipStructure(zipData);
    if !structureResult.isValid {
        io:println("XXX ZIP content security analysis failed");
        return structureResult;
    }
    io:println("3) ZIP content security analysis passed");

    // Return the validation result
    return {
        isValid: true,
        errors: [],
        fileCount: structureResult.fileCount,
        totalUncompressedSize: structureResult.totalUncompressedSize
    };
}

// Validate basic ZIP structure and signatures
isolated function validateBasicZipStructure(byte[] zipData) returns ZipValidationResult {
    string[] errors = [];

    // Minimum ZIP size check
    if zipData.length() < 22 {
        errors.push("ZIP file too small (minimum 22 bytes required)");
        return {isValid: false, errors: errors};
    }

    // Check for ZIP signature at the beginning
    if !hasZipSignature(zipData, 0, ZIP_LOCAL_HEADER_SIGNATURE) {
        errors.push("Invalid ZIP file: missing local file header signature");
    }

    // Look for end of central directory within last 66KB (65,557 bytes)
    boolean foundEndCentral = false;

    // Start at offset length - 22 (EOCDR minimum size)
    int startSearch = zipData.length() - 22;
    // Compute lower bound
    int endSearch = 0;
    if zipData.length() > 65557 {
        endSearch = zipData.length() - 65557;
    }

    int i = startSearch;
    while (i >= endSearch) {
        if hasZipSignature(zipData, i, ZIP_END_CENTRAL_SIGNATURE) {
            foundEndCentral = true;
            break;
        }
        i -= 1;
    }

    if !foundEndCentral {
        errors.push("Invalid ZIP file: missing end of central directory");
    }

    return {
        isValid: errors.length() == 0,
        errors: errors
    };
}

// Helper function to check ZIP signatures
isolated function hasZipSignature(byte[] data, int offset, int signature) returns boolean {
    if offset + 4 > data.length() {
        return false;
    }

    return (data[offset] == (signature & 0xFF)) &&
            (data[offset + 1] == ((signature >> 8) & 0xFF)) &&
            (data[offset + 2] == ((signature >> 16) & 0xFF)) &&
            (data[offset + 3] == ((signature >> 24) & 0xFF));
}

// Validate ZIP filename for security
isolated function validateZipFilename(string filename) returns ZipValidationResult {
    string[] errors = [];

    // Basic checks
    if filename.length() == 0 {
        errors.push("Filename cannot be empty");
    }

    if filename.length() > 255 {
        errors.push("Filename too long (max 255 characters)");
    }

    // Extension check
    if !filename.toLowerAscii().endsWith(".zip") {
        errors.push("File must have .zip extension");
    }

    // Security checks
    if filename.includes("..") {
        errors.push("Filename contains path traversal characters");
    }

    if filename.includes("\u{0000}") {
        errors.push("Filename contains null bytes");
    }

    // Control characters
    if regex:matches(filename, "[\\x00-\\x1F\\x7F]") {
        errors.push("Filename contains control characters");
    }

    return {
        isValid: errors.length() == 0,
        errors: errors
    };
}

// Analyze ZIP content for security and basic metadata
isolated function analyzeZipStructure(byte[] zipData) returns ZipValidationResult {
    string[] errors = [];
    int fileCount = 0;
    int totalUncompressedSize = 0;

    int offset = 0;

    while offset < zipData.length() - 30 {
        // Check for local file header signature
        if hasZipSignature(zipData, offset, ZIP_CENTRAL_HEADER_SIGNATURE) {
            fileCount += 1;

            int compressedSize = readInt32(zipData, offset + 20);
            int uncompressedSize = readInt32(zipData, offset + 24);
            int filenameLength = readInt16(zipData, offset + 28);
            int extraFieldLength = readInt16(zipData, offset + 30);
            int commentLength = readInt16(zipData, offset + 32);

            totalUncompressedSize = totalUncompressedSize + uncompressedSize;

            // Security checks (like before)
            if uncompressedSize > maxUncompressedSizeMB * 1024 * 1024 {
                errors.push("Uncompressed size too large.");
            }
            if compressedSize > 0 && uncompressedSize > 0 {
                int ratio = uncompressedSize / compressedSize;
                if ratio > maxCompressionRatio {
                    errors.push("Suspicious compression ratio.");
                }
            }

            // Move offset to next Central Directory entry
            offset = offset + 46 + filenameLength + extraFieldLength + commentLength;
        } else {
            offset = offset + 1; // keep scanning
        }

    }

    // Total uncompressed size check
    if totalUncompressedSize > maxUncompressedSizeMB * 1024 * 1024 {
        errors.push("Total uncompressed size too large");
    }

    return {
        isValid: errors.length() == 0,
        errors: errors,
        fileCount: fileCount,
        totalUncompressedSize: totalUncompressedSize
    };
}

// Helper function to read 32-bit integer from byte array (little-endian)
isolated function readInt32(byte[] data, int offset) returns int {
    if offset + 4 > data.length() {
        return 0;
    }

    return (data[offset] & 0xFF) |
            ((data[offset + 1] & 0xFF) << 8) |
            ((data[offset + 2] & 0xFF) << 16) |
            ((data[offset + 3] & 0xFF) << 24);
}

// Helper function to read 16-bit integer from byte array (little-endian)
isolated function readInt16(byte[] data, int offset) returns int {
    if offset + 2 > data.length() {
        return 0;
    }

    return (data[offset] & 0xFF) | ((data[offset + 1] & 0xFF) << 8);
}

