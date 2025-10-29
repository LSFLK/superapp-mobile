import ballerinax/azure_storage_service.blobs as azure_blobs;

public configurable AzureBlobServiceConfig azureBlobServiceConfig = ?;

azure_blobs:ConnectionConfig blobServiceConfig = {
    accountName: azureBlobServiceConfig.accountName,
    accessKeyOrSAS: azureBlobServiceConfig.accessKey,
    authorizationMethod: "accessKey"
};
public azure_blobs:BlobClient blobClient = check new (blobServiceConfig);
