// Configurations (add these to your Config.toml or set as environment variables)

configurable int serverPort = 9090;
configurable int maxHeaderSize = 16384; 

configurable string superappIssuer = "superapp-issuer"; 
configurable decimal tokenTTLSeconds = 300; 
configurable string privateKeyPath = ?; 
configurable string publicKeyPath = ?; 