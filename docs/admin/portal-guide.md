# [WIP]Admin Portal Guide

Complete guide for SuperApp administrators to manage users, micro-apps, and system configuration.

## Overview

The SuperApp Admin Portal is a web-based interface for managing the SuperApp platform. As an administrator, you can:

- **Manage MicroApps**: Create, upload, version, and configure micro-apps
- **Manage Users**: Create and manage user accounts
- **Create OAuth Clients**: Generate credentials for microapp backends
- **Configure Access Control**: Set role-based permissions
- **Monitor System**: View logs and analytics

---

## Accessing the Admin Portal

### URL

The admin portal is typically hosted at:
- **Development**: `http://localhost:5173`
- **Production**: `https://admin.superapp.com`

### Login

1. Navigate to the admin portal URL
2. Click "Sign In"
3. Authenticate using your admin credentials (via Asgardeo or configured IDP)
4. You'll be redirected to the admin dashboard

> **Note**: Only users with admin role can access the portal.

---

## Managing MicroApps

### Creating a New MicroApp

1. **Navigate to MicroApps**
   - Click "MicroApps" in the sidebar
   - Click "+ New MicroApp" button

2. **Fill in Basic Information**
   ```
   App ID: unique-app-id (e.g., "news-reader")
   Name: Display name (e.g., "News Reader")
   Description: Brief description of the app
   Promo Text: Marketing text for app store
   ```

3. **Upload Assets**
   - **Icon**: Square image (512x512px recommended)
   - **Banner**: Wide image (1920x1080px recommended)
   - Both should be HTTPS URLs or uploaded files

4. **Configure Access Control** (Optional)
   - Add roles/groups that can access this microapp
   - Leave empty for public access
   - Example roles: `admin`, `user`, `premium`

5. **Add Configuration** (Optional)
   - Key-value pairs passed to the microapp
   - Example:
     ```json
     {
       "apiEndpoint": "https://api.example.com",
       "theme": "dark",
       "features": ["notifications", "offline"]
     }
     ```

6. **Click "Create"**

### Adding a Version

After creating a microapp, you need to add at least one version:

1. **Click on the MicroApp** in the list
2. **Click "+ Add Version"**
3. **Fill in Version Details**
   ```
   Version: 1.0.0 (semantic versioning)
   Download URL: URL to the ZIP file
   ```

4. **Upload Options**
   - **Option A**: Upload ZIP directly (recommended)
     - Click "Upload ZIP"
     - Select your built microapp ZIP file
     - Portal will host it and generate download URL
   
   - **Option B**: Provide external URL
     - Enter URL where ZIP is hosted
     - Must be publicly accessible

5. **Mark as Latest** (checkbox)
   - Check this for the newest version
   - Mobile apps will download this version

6. **Click "Add Version"**

### Updating a MicroApp

1. Navigate to the microapp
2. Click "Edit"
3. Update fields as needed
4. Click "Save Changes"

### Deactivating a MicroApp

1. Navigate to the microapp
2. Click "Deactivate"
3. Confirm the action
4. The microapp will no longer appear in the mobile app store

---

## Creating OAuth Clients for MicroApps

**Important**: Every microapp that has a backend needs OAuth credentials to authenticate with the SuperApp API.

### Step 1: Create OAuth Client

Use the Token Service API to create credentials:

```bash
curl -X POST http://localhost:8081/oauth/clients \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "microapp-news",
    "name": "News Reader Backend",
    "scopes": "read write notifications:send"
  }'
```

**Response:**
```json
{
  "client_id": "microapp-news",
  "client_secret": "aB3dE5fG7hI9jK1lM3nO5pQ7rS9tU1vW",
  "name": "News Reader Backend",
  "scopes": "read write notifications:send",
  "is_active": true
}
```

> **⚠️ Critical**: The `client_secret` is only shown once. Save it immediately!

### Step 2: Store Credentials Securely

Store the credentials in a secure location:
- **Development**: `.env` file (never commit to git)
- **Production**: Secret management system (AWS Secrets Manager, Vault, etc.)

### Step 3: Provide to MicroApp Developer

Send the credentials to the microapp backend developer:

```
Client ID: microapp-news
Client Secret: aB3dE5fG7hI9jK1lM3nO5pQ7rS9tU1vW
Token Endpoint: https://api.superapp.com/oauth/token
```

The developer will use these to authenticate their backend with the SuperApp API.

### Common Scopes

| Scope | Description |
|-------|-------------|
| `read` | Read user data |
| `write` | Write user data |
| `notifications:send` | Send push notifications to users |
| `users:read` | Read user profiles |
| `admin` | Administrative access (use sparingly) |

---

## Managing Users

### Creating a User

1. **Navigate to Users**
   - Click "Users" in the sidebar
   - Click "+ New User" button

2. **Fill in User Details**
   ```
   Email: user@example.com
   First Name: John
   Last Name: Doe
   Location: New York, USA (optional)
   User Thumbnail: Profile picture URL (optional)
   ```

3. **Click "Create User"**

> **Note**: Users must also be created in your IDP (Asgardeo) for authentication.

### Updating User Information

1. Navigate to the user
2. Click "Edit"
3. Update fields
4. Click "Save Changes"

### Deleting a User

1. Navigate to the user
2. Click "Delete"
3. Confirm the action

> **Warning**: This only deletes the user from the SuperApp database, not from the IDP.

---

## Role-Based Access Control

### Assigning Roles to MicroApps

When creating or editing a microapp:

1. Scroll to "Access Control" section
2. Add role names (comma-separated)
   ```
   Example: admin, premium, user
   ```
3. Save changes

Users must have at least one matching role to see the microapp in their app store.

### Managing User Roles

User roles are managed in your IDP (Asgardeo):

1. Log in to Asgardeo console
2. Navigate to Users
3. Select a user
4. Assign roles under "Roles" tab

---

## Best Practices

### MicroApp Management

- ✅ Use semantic versioning (1.0.0, 1.0.1, 1.1.0, 2.0.0)
- ✅ Test microapps thoroughly before marking as "latest"
- ✅ Keep old versions available for rollback
- ✅ Use descriptive names and clear descriptions
- ✅ Optimize images (compress icons and banners)
- ✅ Document configuration keys for developers

### OAuth Client Management

- ✅ Create separate clients for each microapp backend
- ✅ Use descriptive names (e.g., "News Reader Backend")
- ✅ Grant minimum required scopes (principle of least privilege)
- ✅ Rotate secrets periodically (every 90 days recommended)
- ✅ Store secrets in secure secret management systems
- ✅ Never commit secrets to version control

### User Management

- ✅ Use consistent naming conventions
- ✅ Verify email addresses
- ✅ Assign appropriate roles
- ✅ Remove inactive users regularly
- ✅ Keep IDP and SuperApp database in sync

---

## Troubleshooting

### MicroApp Not Appearing in Mobile App

**Possible Causes:**
1. MicroApp is deactivated
2. User doesn't have required role
3. No version marked as "latest"
4. Download URL is inaccessible

**Solutions:**
- Check microapp status (should be active)
- Verify user has matching role
- Ensure at least one version is marked "latest"
- Test download URL in browser

### OAuth Client Authentication Failing

**Possible Causes:**
1. Wrong client ID or secret
2. Client is inactive
3. Token endpoint URL is incorrect

**Solutions:**
- Verify credentials match exactly
- Check client status in database
- Confirm token endpoint: `https://api.superapp.com/oauth/token`
- Test with curl:
  ```bash
  curl -X POST https://api.superapp.com/oauth/token \
    -u "client_id:client_secret" \
    -d "grant_type=client_credentials"
  ```

### User Can't Log In

**Possible Causes:**
1. User doesn't exist in IDP
2. Wrong credentials
3. User is disabled

**Solutions:**
- Verify user exists in Asgardeo
- Check user status (should be enabled)
- Reset password if needed
- Check IDP logs for errors

---

## Next Steps

- [API Reference](../api/reference.md) - Complete API documentation
