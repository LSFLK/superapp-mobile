# File Service Interface.
public type FileService distinct object {
    public function uploadFile(FileData fileData) returns FileUploadResponse|error;
    public function deleteFile(string fileName) returns boolean|error;
};

# File Service Factory: Creates a new file service instance.
#
# + 'type - The type of the file service.
# + return - The created FileService instance or an error if the type is unknown.
public isolated function createFileService(string 'type) returns FileService|error {
    string _type = 'type.toLowerAscii().trim();
    if (_type == AZURE_BLOB_SERVICE) {
        return new AzureBlobService(azureBlobConfig);
    }

    return error("Unknown file service type");
}
