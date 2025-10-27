import ballerina/http;
import ballerina/log;
import ballerina/time;

# Azure Blob configuration record.
#
# + storageAccountName - The name of the Azure storage account.
# + sasToken - The SAS token for accessing the storage account.
# + containerName - The default container name for storing files.
public type AzureBlobConfig record {|
    string storageAccountName;
    string sasToken;
    string containerName;
|};

configurable AzureBlobConfig azureBlobConfig = ?;

# Azure Blob File service implementation.
public isolated distinct class AzureBlobService {
    *FileService;

    private final string storageAccountName;
    private final string sasToken;
    private final string containerName;
    private final http:Client httpClient;

    # Initialize the Azure Blob Service with the given configuration.
    # + config - The Azure Blob configuration.
    # + return - An error if initialization fails.
    public isolated function init(AzureBlobConfig config) returns error? {
        log:printInfo("Initializing AzureBlobService with config");
        self.storageAccountName = config.storageAccountName;
        self.sasToken = config.sasToken;
        self.containerName = config.containerName;

        string baseUrl = string `https://${self.storageAccountName}.blob.core.windows.net`;
        self.httpClient = check new (baseUrl, {
            timeout: 300, // 5 minutes timeout for large files
            httpVersion: http:HTTP_1_1, // Force HTTP/1.1 to avoid Transfer-Encoding issues
            http1Settings: {chunking: http:CHUNKING_NEVER} // Disable chunked transfer encoding
        });
    }

    # Upload a file to Azure Blob Storage.
    # + fileData - The file data to be uploaded.
    # + return - The file upload response or an error if the upload fails.
    public isolated function uploadFile(FileData fileData) returns FileUploadResponse|error {
        string container = self.containerName;
        string fileName = fileData.fileName;
        string blobPath = string `/${container}/${fileName}`;
        string sasQuery = string `?${self.sasToken}`;
        string requestPath = string `${blobPath}${sasQuery}`;

        http:Request request = new;
        request.setBinaryPayload(fileData.content);
        request.setHeader("x-ms-blob-type", "BlockBlob");
        request.setHeader("Content-Type", fileData.contentType);
        request.setHeader("Content-Length", fileData.content.length().toString());

        http:Response response = check self.httpClient->put(requestPath, request);
        if response.statusCode != 201 {
            string errorMessage = check response.getTextPayload();
            log:printError("Failed to upload file to Azure", statusCode = response.statusCode, errorDetails = errorMessage);
            return error(string `Failed to upload file: ${errorMessage}`);
        }

        string fileUrl = string `https://${self.storageAccountName}.blob.core.windows.net/${container}/${fileName}`;

        time:Utc currentTime = time:utcNow();
        string timestamp = time:utcToString(currentTime);

        return {
            url: fileUrl,
            fileName: fileName,
            fileSize: fileData.content.length(),
            contentType: fileData.contentType,
            uploadedAt: timestamp
        };
    }

    # Upload multiple files to Azure Blob Storage.
    # + files - The array of file data to be uploaded.
    # + return - An array of file upload responses or an error if the upload fails.
    public isolated function uploadFiles(FileData[] files) returns FileUploadResponse[]|error {
        FileUploadResponse[] responses = [];

        foreach FileData fileData in files {
            FileUploadResponse|error uploadResult = self.uploadFile(fileData);
            if uploadResult is error {
                log:printError("Failed to upload file", fileName = fileData.fileName, 'error = uploadResult);
                return uploadResult;
            }
            responses.push(uploadResult);
        }

        return responses;
    }

    # Delete a file from Azure Blob Storage.
    # + fileName - The name of the file to be deleted.
    # + return - true if deletion is successful, false otherwise.
    public isolated function deleteFile(string fileName) returns boolean|error {
        string container = self.containerName;
        string blobPath = string `/${container}/${fileName}`;
        string sasQuery = self.sasToken.startsWith("?") ? self.sasToken : string `?${self.sasToken}`;
        string requestPath = string `${blobPath}${sasQuery}`;

        http:Request request = new;
        http:Response response = check self.httpClient->delete(requestPath, request);
        if response.statusCode == 202 || response.statusCode == 404 {
            return true;
        }

        string errorMessage = check response.getTextPayload();
        log:printError("Failed to delete file from Azure", statusCode = response.statusCode, errorDetails = errorMessage);
        return error(string `Failed to delete file: ${errorMessage}`);
    }
}
