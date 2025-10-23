import ballerina/http;
import ballerina/time;
import ballerina/log;

public type AzureBlobConfig record {|
    string storageAccountName;
    string sasToken;
    string defaultContainerName;
|};

configurable AzureBlobConfig azureBlobConfig = ?;
final AzureBlobService fileService = check new AzureBlobService(azureBlobConfig);

// Get the initialized file service client
public function getFileService() returns AzureBlobService {
    return fileService;
}

// Azure Blob Storage service implementation
public class AzureBlobService {
    private final string storageAccountName;
    private final string sasToken;
    private final string defaultContainerName;
    private final http:Client httpClient;
    
    public function init(AzureBlobConfig config) returns error? {
        self.storageAccountName = config.storageAccountName;
        self.sasToken = config.sasToken;
        self.defaultContainerName = config.defaultContainerName;
        
        string baseUrl = string `https://${self.storageAccountName}.blob.core.windows.net`;
        self.httpClient = check new (baseUrl, {
            timeout: 300, // 5 minutes timeout for large files
            httpVersion: http:HTTP_1_1, // Force HTTP/1.1 to avoid Transfer-Encoding issues
            http1Settings: {chunking: http:CHUNKING_NEVER} // Disable chunked transfer encoding
        });
    }
    
    public function uploadFile(FileData fileData, string? containerName = ()) returns FileUploadResponse|error {
        string container = containerName ?: self.defaultContainerName;
        string fileName = fileData.fileName;
        
        // Build the blob URL with SAS token
        string blobPath = string `/${container}/${fileName}`;
        string sasQuery = string `?${self.sasToken}`;
        string requestPath = string `${blobPath}${sasQuery}`;
        
        // Upload the file using PUT request
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
        
        // Get the blob URL (without SAS token for security)
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
    
    // Upload multiple files to Azure Blob Storage
    public function uploadFiles(FileData[] files, string? containerName = ()) returns FileUploadResponse[]|error {
        FileUploadResponse[] responses = [];
        
        foreach FileData fileData in files {
            FileUploadResponse|error uploadResult = self.uploadFile(fileData, containerName);
            if uploadResult is error {
                log:printError("Failed to upload file", fileName = fileData.fileName, 'error = uploadResult);
                return uploadResult;
            }
            responses.push(uploadResult);
        }
        return responses;
    }
    
    // Delete a file from Azure Blob Storage
    public function deleteFile(string fileName, string? containerName = ()) returns boolean|error {
        string container = containerName ?: self.defaultContainerName;
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

