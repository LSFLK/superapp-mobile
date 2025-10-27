public type FileService distinct object {
    public isolated function uploadFile(FileData fileData, string? containerName = ()) returns FileUploadResponse|error;
    public isolated function uploadFiles(FileData[] files, string? containerName = ()) returns FileUploadResponse[]|error;
    public isolated function deleteFile(string fileName, string? containerName = ()) returns boolean|error;
};

public isolated function createFileService(string 'type) returns FileService|error {
    if ('type == "azure-blob") {
        return new AzureBlobServiceImpl(azureBlobConfig);
    }
    // Add more implementations here (e.g., AWS S3, local file system, etc.)
    return error("Unknown file service type");
}
