// ZIP file header constants for ZIP file validation
const int ZIP_LOCAL_HEADER_SIGNATURE = 0x04034b50; // "PK\3\4"
const int ZIP_CENTRAL_HEADER_SIGNATURE = 0x02014b50; // "PK\1\2"
const int ZIP_END_CENTRAL_SIGNATURE = 0x06054b50; // "PK\5\6"

// Maximum number of files allowed in a ZIP
const int MAX_FILES_IN_ZIP = 100;

// Maximum uncompressed size in MB
const int MAX_UNCOMPRESSED_SIZE_MB = 100;

// Maximum compression ratio (e.g., 100:1)
const int MAX_COMPRESSION_RATIO = 100;