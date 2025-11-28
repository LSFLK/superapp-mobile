# Notification Service Integration Guide

This guide explains how microapp developers can integrate with the Superapp Notification Service to send push notifications to users.

## Authentication Flow (OAuth2)

The service uses **OAuth2 Client Credentials** flow for server-to-server authentication. You will exchange your `client_id` and `client_secret` for a short-lived access token.

### 1. Obtain Credentials
Contact the Superapp Admin to register your microapp and receive your:
- `client_id` (this is your microapp identifier)
- `client_secret`

> [!IMPORTANT]
> Keep your `client_secret` secure! Never expose it in client-side code or public repositories.

### 2. Generate Access Token
Call the token endpoint to get a JWT access token.

**Endpoint:** `POST /oauth/token`

**Request:**
```bash
curl -X POST https://api.superapp.com/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "client_credentials",
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1Ni...",
  "token_type": "Bearer",
  "expires_in": 120
}
```

### 3. Send Notification
Use the `access_token` to send notifications. Your `client_id` serves as your microapp identifier, so notifications are automatically associated with your microapp.

**Endpoint:** `POST /api/v1/services/notifications/send`

**Request:**
```bash
curl -X POST https://api.superapp.com/api/v1/services/notifications/send \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "userEmails": ["user@example.com"],
    "title": "Order Update",
    "body": "Your order #12345 has shipped!",
    "data": {
      "orderId": "12345",
      "action": "view_order"
    }
  }'
```

**Payload Fields:**
- `userEmails`: Array of user emails to target.
- `title`: Notification title.
- `body`: Notification body text.
- `data`: (Optional) Key-value pairs for deep linking or extra data.

## Best Practices
- **Cache the Token**: Tokens are valid for a short duration (e.g., 2 minutes). Cache the token and reuse it until it expires to avoid hitting the token endpoint for every notification.
- **Retry Logic**: If you receive a `401 Unauthorized`, your token may have expired. Request a new token and retry the notification.
- **HTTPS**: Always use HTTPS for all requests to protect your credentials.
