// Authorization Constants
public const JWT_ASSERTION_HEADER = "x-jwt-assertion";
public const ISSUER = "https://api.asgardeo.io/t/lsfproject/oauth2/token";

# super-app audience
public const AUDIENCE_1 = "5jjnGuEZz1BcyfhJ_CCHrbdJEzEa";
# Admin-portal audience (if there is any)
public const AUDIENCE_2 = "aVro3ATf5ZSglZHItEDj0Kd7M4wa";


// ZIP file header constants for ZIP file validation
const int ZIP_LOCAL_HEADER_SIGNATURE = 0x04034b50; // "PK\3\4"
const int ZIP_CENTRAL_HEADER_SIGNATURE = 0x02014b50; // "PK\1\2"
const int ZIP_END_CENTRAL_SIGNATURE = 0x06054b50; // "PK\5\6"
