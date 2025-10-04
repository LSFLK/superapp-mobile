// Configurations (add these to your Config.toml or set as environment variables)

configurable int serverPort = 9090;
configurable int maxHeaderSize = 16384; 

configurable string superappIssuer = "superapp-issuer"; 
configurable decimal tokenTTLSeconds = 300; 
configurable string privateKeyPath = ?; 
configurable string publicKeyPath = ?; 

// Configuration for validation limits
configurable int maxFilesInZip = 100;
configurable int maxUncompressedSizeMB = 100;
configurable int maxCompressionRatio = 100; // Max 100:1 compression ratio (Can increase if you want to relax the threshold)