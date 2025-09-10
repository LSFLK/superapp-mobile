# Payslip Viewer Backend Service

Ballerina microservice for managing and serving employee payslip data.


## Quick Start

### Prerequisites
- Ballerina 2201.12.9 or later
- Java 11 or later

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd backend-payslip-viewer

# Run the service
bal run
```

### Configuration
The service can be configured using `config.bal`:

```ballerina
// Authentication configuration (disabled by default)
configurable AuthConfig authConfig = {
    enabled: false,  // Set to true to enable authentication
    jwtSecret: "your-jwt-secret-key",
    tokenExpirySeconds: 3600,
    publicEndpoints: ["/api/v1/payslips/health"]
};

// Service configuration
configurable int serverPort = 8080;
configurable string environment = "development";
configurable string serviceVersion = "1.0.0";
```

### Testing
```bash
# Health check
curl http://localhost:8080/api/v1/payslips/health

# Get all payslips (no auth required by default)
curl http://localhost:8080/api/v1/payslips/

# Get specific payslip
curl http://localhost:8080/api/v1/payslips/EMP001

# With authentication enabled, include Bearer token:
curl -H "Authorization: Bearer admin-token" http://localhost:8080/api/v1/payslips/
```


### Authentication

The service supports configurable JWT-based authentication:

#### Authentication Tokens (Mock Implementation)
```bash
# Admin token (full access)
Authorization: Bearer admin-token

# Employee tokens (own data only)
Authorization: Bearer emp001-token  # For EMP001
Authorization: Bearer emp002-token  # For EMP002
```

#### Key Endpoints
- `GET /api/v1/payslips/health` - Health check (always public)
- `GET /api/v1/payslips/` - Get all payslips (filtered by role)
- `GET /api/v1/payslips/{employeeId}` - Get payslip by employee ID
- `GET /api/v1/payslips/{employeeId}?payPeriod=2024-01` - Get payslip for specific period

#### Response Format
```json
{
  "status": "success",
  "message": "Payslips retrieved successfully",
  "data": [...],
  "count": 3
}
```

#### Error Response Format
```json
{
  "status": "error",
  "message": "Validation failed",
  "errorCode": "VALIDATION_ERROR",
  "details": "employeeId: Employee ID must follow format: ABC123"
}
```

## Architecture

### File Structure
```
backend-payslip-viewer/
├── service.bal           # Main HTTP service with authentication
├── types.bal            # Data models and authentication types
├── utils.bal            # Validation, auth utilities, and response builders
├── config.bal           # Service and authentication configuration
├── Ballerina.toml       # Package configuration
└── README.md           # This documentation
```

## Development

### Enabling Authentication
To enable authentication in production:

1. **Update Configuration**:
```ballerina
// In config.bal, change:
configurable AuthConfig authConfig = {
    enabled: true,  // Enable authentication
    jwtSecret: "your-production-jwt-secret",
    tokenExpirySeconds: 3600,
    publicEndpoints: ["/api/v1/payslips/health"]
};
```

2. **Implement Production JWT Validation**:
Replace the mock `validateToken()` function in `utils.bal` with actual JWT library implementation.

3. **Test with Real Tokens**:
```bash
# Use actual JWT tokens instead of mock tokens
curl -H "Authorization: Bearer <real-jwt-token>" http://localhost:8080/api/v1/payslips/
```

### Adding New Features
1. **Add types** in `types.bal`
2. **Add utilities** in `utils.bal` 
3. **Add endpoints** in `service.bal`
4. **Update documentation** in this README

### Database Integration
The service is ready for database integration:

1. **Add database module** to `Ballerina.toml`:
```toml
[[dependency]]
org = "ballerina"
name = "sql"
version = "1.12.2"
```

2. **Replace mock functions** in `service.bal`:
```ballerina
// Replace getMockPayslips() with database queries
function getPayslipsFromDB() returns Payslip[]|error {
    // Database implementation
}
```

3. **Add database configuration** to `config.bal`


### Error Codes Reference
- `VALIDATION_ERROR`: Input validation failed
- `RESOURCE_NOT_FOUND`: Payslip not found
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Access denied
- `INVALID_TOKEN`: JWT token invalid/expired
- `INVALID_AUTH_HEADER`: Authorization header malformed
