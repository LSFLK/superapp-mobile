// // To be implemented when 'extensions' endpoint is available in SuperApp Backend.

//     # Upload file directly in request body
//     # Headers: Content-Type
//     #
//     # + request - HTTP request with binary body
//     # + fileName - File name as a query parameter
//     # + folderName - Folder name as a query parameter (optional)
//     # + return - Upload response with file URL or error
//     resource function post files(http:Request request, string fileName, string? folderName = null) 
//         returns http:Created|http:InternalServerError {

//         byte[]|error content = request.getBinaryPayload();
//         if content is error {
//             string customError = azure_fileservice:ERROR_READING_REQUEST_BODY;
//             log:printError(customError, content);
//             return <http:InternalServerError>{
//                 body: {
//                     message: customError
//                 }
//             };
//         }

//         string filepath = string `${folderName is null ? "" : folderName + "/"}${fileName}`;
//         azure_blobs:ResponseHeaders|azure_blobs:Error result = azure_fileservice:blobClient->putBlob(azure_fileservice:azureBlobServiceConfig.containerName, filepath, azure_fileservice:BLOB_TYPE_BLOCK, content);
//         if result is azure_blobs:Error {
//             string customError = azure_fileservice:ERROR_UPLOADING_FILE;
//             log:printError(customError, 'error = result);
//             return <http:InternalServerError>{
//                 body: {
//                     message: customError
//                 }
//             };
//         }

//         string downloadUrl = azure_fileservice:getDownloadUrl(azure_fileservice:azureBlobServiceConfig.containerName, filepath);
//         return <http:Created>{
//             body: {
//                 message: azure_fileservice:SUCCESS_FILE_UPLOADED,
//                 downloadUrl: downloadUrl
//             }
//         };

//     }

//     # Delete file by name
//     # Headers: None
//     #
//     # + request - HTTP request
//     # + fileName - File name as a query parameter
//     # + folderName - Folder name as a query parameter (optional)
//     # + return - No content or error
//     resource function delete files(http:Request request, string fileName, string? folderName = null) 
//         returns http:NoContent|http:InternalServerError {
        
//         string filepath = string `${folderName is null ? "" : folderName + "/"}${fileName}`;
//         azure_blobs:ResponseHeaders|azure_blobs:Error result = azure_fileservice:blobClient->deleteBlob(azure_fileservice:azureBlobServiceConfig.containerName, filepath);
//         if result is azure_blobs:Error {
//             string customError = azure_fileservice:ERROR_DELETING_FILE;
//             log:printError(customError, 'error = result);
//             return <http:InternalServerError>{
//                 body: {
//                     message: customError
//                 }
//             };
//         }

//         return <http:NoContent>{};
//     }