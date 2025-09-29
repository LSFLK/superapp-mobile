# Payslip Service

A microservice for managing employee payslips.  
Supports JWT-based authentication, CSV upload for bulk payslips, health checks, and admin-specific endpoints.


## Project Structure

```bash
.
├── config.bal            # Service and DB configuration
├── types.bal             # Core data models and API types
├── db_client.bal         # Singleton DB client
├── db_functions.bal      # Database helper functions
├── service.bal           # Main Ballerina service
├── validator.bal     # JWT validation and interceptor
├── utils.bal             # Health, logging, and auth utilities
├── config.toml.example   # Example TOML configuration
└── README.md
```

## Features

- Fetch the latest payslip for an employee.
- Fetch all payslips (general and admin views).
- Upload CSV to insert multiple payslips in bulk.
- JWT-based authentication and role-based access.
- Health check endpoints.
- Configurable via TOML file or environment variables.
- Graceful shutdown and logging.



## Prerequisites

- Ballerina SDK installed ([https://ballerina.io](https://ballerina.io))
- MySQL database
- JWT public keys for microapp and admin portal
- Optional: Docker for containerized deployment


## Configuration

1. **`config.toml.example`**:

```toml
# Root-level configuration
publicKeyPath_microapp = "./<your-superapp-public-key>.pem"
publicKeyPath_adminPortal = "./<your-idp-certificate>.crt"

[databaseConfig]
DB_HOST = "<your-db-host-name>"
DB_PORT = 3306
DB_NAME = "<your-db-name>"
DB_USER = "<your-db-admin-name>"
DB_PASSWORD = "<your-db-password>"
```

2. **Copy `config.toml.example` to `config.toml:`**
```bash
cp config.toml.example config.toml
```

3. Update the values with your local database credentials and public keys.

## Running Locally

1. Clone the repository
```bash
git clone <repo-url>
cd payslip-service
```
2. Ensure your MySQL database is running and the user has appropriate privileges.

3. Build and run the service:
```bash
bal run
```
4. By default, the service will start on port 9090. Example endpoints:
- Health check:`GET http://localhost:9090/health`
- Fetch latest payslip: `GET http://localhost:9090/payslip`
- Fetch all payslips: `GET http://localhost:9090/all`

## Available API Endpoints

- The following is a summary of the backend API routes, including their purpose and return types.  
- All endpoints use JWT-based authentication unless marked as **Public**.

| Endpoint | Method | Description | Response Type |
|---|---|---|---|
| `/health` | GET | Service health check (**Public**) | `{ status: string, uptime: number }` |
| `/payslip` | GET | Fetch the latest payslip for the authenticated employee | `Payslip` or `404 NotFound` |
| `/all` | GET | Fetch all payslips for the authenticated employee | `Payslip[]` |
| `/admin-portal/all` | GET | Fetch all payslips (admin view) | `Payslip[]` |
| `/admin-portal/upload` | POST | Upload a CSV file for bulk payslips | `{ status: string, message: string }` |




