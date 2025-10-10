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