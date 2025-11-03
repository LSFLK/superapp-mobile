# Super App Mobile Backend

This is the Ballerina based backend for the Superapp Mobile. It powers the mobile experience by exposing RESTful APIs, integrating with databases, and retrieving entity information from internal services. The backend is modular and designed for scalability, security, and reusability across multiple micro apps.

## Project Structure
```bash
backend/
├── Ballerina.toml # Ballerina project metadata and dependency configuration
├── Dependencies.toml # Auto generated file that records the resolved dependencies of the project
├── constants.bal # Common constants
├── service.bal # Main service layer exposing HTTP endpoints
├── types.bal # Common type definitions
├── utils.bal # Common utility/helper functions
├── modules/
│   ├── authorization/ # JWT-based authentication and authorization module
│   ├── azure_fileservice/ # Azure Blob Storage integration for file uploads (if needed)
│   ├── database/ # Database access module for micro apps, versions, roles, and user configs
│   ├── db_fileservice/ # Database-based file storage service for micro app files
│   ├── db_userservice/ # User management service with database operations
│   └── token_exchange/ # JWT token generation and JWKS management
```

## Prerequisites
- Ballerina distribution 2201.10.4 or compatible
- SQL database and credentials (See the "Database Schema Expectations" for the schema definition)
- RS256 private key (.pem) for signing micro-app JWTs
- config.toml filled with appropriate values before running for testing

## Configuration
Refer to `config.toml.local` for the configuration template. Fill in the required values for database connections, private key path, and other service-specific settings in `config.toml`.

## Managing Secrets
The backend uses RS256 for JWT signing and exposes the public key as a JSON Web Key Set (JWKS) for token verification.

- **Private Key**: Place your RS256 private key (.pem) file at `./modules/token_exchange/private_key.pem` (or update `privateKeyPath` in config).
- **Public Key**: Update `./modules/token_exchange/jwks.json` with the corresponding public key information (modulus `n` and exponent `e` for RSA keys). This JWKS is served at `/.well-known/jwks` for external verification.
- **Key Generation**: Ensure the public key in JWKS matches the private key used for signing. Use tools like OpenSSL to extract public key details if needed.

## Setup

```bash
cd backend
bal build
bal run
```

## Authentication
Most API endpoints require JWT-based authentication. Incoming JWTs are validated using the configured IdP public certificate. User information (email, groups) is extracted from the JWT and used for authorization.

- **Local Testing**: Use the `x-jwt-assertion` header carrying the access token.
- **Production**: The `Authorization: Bearer <token>` header is validated at the API Gateway, which passes user attributes via the `x-jwt-assertion` header.
- **JWT Interceptor**: Resolves the `x-jwt-assertion` header to decode the payload and extract user info.

- **Public Endpoint**: `/.well-known/jwks` - Serves the JSON Web Key Set for token verification (no authentication required).
- **Protected Endpoints**: All other endpoints require a valid JWT in the Authorization header.

## API Endpoints
The following is a summary of the backend API routes, including their purpose and return types.

| Endpoint                 | Method | Description                                           | Response Type |
|--------------------------|--------|-------------------------------------------------------|---------------|
| `/.well-known/jwks`      | GET    | Serves the JSON Web Key Set for token verification    | `JsonWebKeySet` |
| `/files`                 | POST   | Upload file directly in request body                   | `201 Created` |
| `/files`                 | DELETE | Delete file by name                                    | `204 No Content` |
| `/micro-app-files/download/{fileName}` | GET | Download Micro App file by name                        | `byte[]` |
| `/user-info`             | GET    | Fetch user information of the logged-in user          | `User` |
| `/micro-apps`            | GET    | Retrieve all micro apps available to the user         | `MicroApp[]` |
| `/micro-apps/{appId}`    | GET    | Retrieve details of a specific micro app by App ID    | `MicroApp` |
| `/micro-apps`            | POST   | Create or update a MicroApp with versions and roles   | `201 Created` |
| `/micro-apps/{appId}/versions` | POST | Add a new version to an existing MicroApp             | `201 Created` |
| `/micro-apps/{appId}/roles` | POST | Add a role mapping to an existing MicroApp            | `201 Created` |
| `/micro-apps/deactivate/{appId}` | PUT | Deactivate a MicroApp by setting it inactive          | `200 OK` |
| `/versions?platform={ios/android}` | GET | Retrieve Super App version info for a platform        | `Version[]` |
| `/users/app-configs`     | GET    | Fetch user's downloaded micro app configurations      | `AppConfig[]` |
| `/users/app-configs`     | POST   | Add/update user's downloaded micro app configurations | `201 Created` |
| `/users`                 | POST   | Insert or update user information (single or bulk)    | `201 Created` |
| `/users`                 | GET    | Get all users                                         | `User[]` |
| `/users/{email}`         | DELETE | Delete a user by email                                | `204 No Content` |
| `/tokens`                | POST   | Request a JWT for authorization                        | `string` |

## 📦 Schema Definitions

<img src="../resources/database_schema.png" alt="Database Schema" width="700"/>

To create the database schema, run the `schema.sql` script located in the `scripts` folder.

| Table Name             | Description                                                                                           |
|------------------------|-------------------------------------------------------------------------------------------------------|
| **micro_app**          | Stores micro app details, including micro app ID, name, description, promo text, icon URL, and banner image URL. |
| **micro_app_role**     | Manages micro app accessibility based on specific user groups (e.g., Asgardeo groups), allowing apps to be specialized for certain groups. |
| **micro_app_version**  | Stores release versions, release notes, and other details about micro-apps.                           |
| **superapp_version**   | Stores release versions, release notes, and other details about the Super App.                        |
| **user_config**        | Stores user details and configurations for the Super App.                                             |
| **users_**             | Stores user information including email, name, thumbnail, and location.                               |
| **micro_apps_storage** | Stores micro app files as binary data with file names.                                                |

---

## Deployment Notes
- Build the JAR via `bal build` and deploy in a JVM environment that can access `config.toml` and key material.
- Ensure DB connectivity and SSL requirements are met.
- Lock down CORS and validate audiences/issuer for production.

## Managing Secrets in Production Environment
Never commit private keys or certificates to source control. The service reads keys from file paths configured via `privateKeyPath`. In all environments, mount or materialize those files at runtime and point the path in `config.toml` accordingly.

General guidelines:
- Keep keys as files on the container/host filesystem; set permissions to 600 and owned by the runtime user.
- Inject secrets via your platform's secret manager; do not store them as plain env vars when avoidable.
- Ensure the mounted in-container file path match the `privateKeyPath` in `config.toml`.

Local development:
- Place generated `private_key.pem`in the `modules/token_exchange`, then set:
  - `privateKeyPath = "./private_key.pem"`

Kubernetes (generic)
Quick start:
- Create Secrets from files
- Mount as volumes in Deployment
- Point config to mounted paths
- Further reading: [Kubernetes Secrets docs](https://kubernetes.io/docs/concepts/configuration/secret/)

AWS
Quick start:
- EKS: Use K8s Secrets or AWS Secrets Manager CSI Driver to mount as files.
- ECS/Fargate:
  - Create secrets in AWS Secrets Manager or SSM Parameter Store.
  - Inject as env vars and materialize to files via entrypoint script, or use volumes if supported.
- EC2/Elastic Beanstalk:
  - Fetch from Secrets Manager on boot (instance profile), write to `/etc/superapp/keys`, `chmod 600`.
- Further reading: [AWS Secrets Manager guide](https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html)

GCP
Quick start:
- GKE: Use K8s Secrets or Secret Manager CSI Driver to mount files.
- Cloud Run: Configure Secret mounts to files (Console -> Revisions -> Volumes) and update `config.toml` paths.
- Further reading: [GCP Secret Manager guide](https://cloud.google.com/security/products/secret-manager)

Azure
Quick start:
- AKS: Use K8s Secrets or Azure Key Vault Provider for Secrets Store CSI to mount files.
- App Service / Container Apps: Reference Key Vault secrets and materialize to files via startup script.
- Further reading: [Azure Key Vault with CSI guide](https://learn.microsoft.com/en-us/azure/key-vault/secrets/)

Choreo
Quick start:
- In the Choreo Console, add Secrets for PEM (Project -> Component -> DevOps -> Configs & Secrets).
- Configure File Mounts so secrets appear as files (e.g., `/private_key.pem`).
- Point config to mounted paths:
  ```toml
  privateKeyPath = "/private_key.pem"
  ```
- Further reading: [Choreo secrets and file mounts guide](https://wso2.com/choreo/docs/devops-and-ci-cd/manage-configurations-and-secrets/)

## Developer Guide: Adding a New Endpoint

To add a new API endpoint to the backend:

1. **Determine the Module**: Decide if the endpoint belongs to an existing module (e.g., `database`, `db_userservice`) or requires a new one. For database operations, use the appropriate module.

2. **Add Database Queries**: If the endpoint interacts with the database, add parameterized queries to the module's `db_queries.bal` file (e.g., `modules/database/db_queries.bal`).

3. **Implement Functions**: Add business logic functions to the module's `db_functions.bal` or equivalent file. Ensure functions are isolated and handle errors properly.

4. **Define Types**: If new data types are needed, add them to the module's `types.bal` or the root `types.bal`.

5. **Add the Endpoint**: In `service.bal`, add the resource function under the appropriate service. Include proper HTTP annotations, parameter validation, and error handling.

6. **Authentication**: Most endpoints require JWT auth via the interceptor. For public endpoints, exclude them from the interceptor or handle separately.

7. **Update Documentation**: Add the new endpoint to the API Endpoints table in this README.
