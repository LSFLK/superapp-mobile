public type FileUploadResponse record {|
    string url;
    string fileName;
    int fileSize;
    string contentType;
    string uploadedAt;
|};

// Represents a file to be uploaded
public type FileData record {|
    byte[] content;
    string fileName;
    string contentType;
|};
