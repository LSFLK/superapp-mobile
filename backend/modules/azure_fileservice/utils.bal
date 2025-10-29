# Get download URL for a blob file
#
# + containerName - Container name (optional) 
# + blobPath - Blob file path
# + return - Download URL for the blob file
public isolated function getDownloadUrl(string? containerName, string blobPath) returns string {
    return string `https://${azureBlobServiceConfig.accountName}.blob.core.windows.net/${containerName is null ? "" : containerName + "/"}${blobPath}`;
}
