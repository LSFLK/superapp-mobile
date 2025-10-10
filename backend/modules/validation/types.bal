// ZIP validation result
public type ZipValidationResult record {|
    boolean isValid;
    string[] errors;
    int fileCount?;
    int totalUncompressedSize?;
|};

