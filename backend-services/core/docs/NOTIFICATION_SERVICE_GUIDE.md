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
Call the **public** token endpoint to get a JWT access token.

**Endpoint:** `POST /oauth/token` (Public - No authentication required)

**Request (Recommended - Form-encoded):**
```bash
curl -X POST https://api.superapp.com/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET"
```

**Alternative (Basic Auth - More secure):**
```bash
# First, base64 encode "client_id:client_secret"
# Example: echo -n "your_client_id:your_secret" | base64

curl -X POST https://api.superapp.com/oauth/token \
  -H "Authorization: Basic <BASE64_ENCODED_CLIENT_ID:CLIENT_SECRET>" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials"
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1Ni...",
  "token_type": "Bearer",
  "expires_in": 7200
}
```

### 3. Send Notification
Use the `access_token` to send notifications. This endpoint is **service-authenticated** and requires a valid service token.

**Endpoint:** `POST /api/v1/services/notifications/send` (Service-authenticated - Requires Bearer token)

**Request:**
```bash
curl -X POST https://api.superapp.com/api/v1/services/notifications/send \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "user_emails": ["user@example.com"],
    "title": "Order Update",
    "body": "Your order #12345 has shipped!",
    "data": {
      "orderId": "12345",
      "action": "view_order"
    }
  }'
```

**Payload Fields:**
- `user_emails`: Array of user emails to target.
- `title`: Notification title.
- `body`: Notification body text.
- `data`: (Optional) Key-value pairs for deep linking or extra data. The `microappId` is automatically added.

**Response:**
```json
{
  "success": 2,
  "failed": 0,
  "message": "Notifications sent successfully"
}
```

## Endpoint Summary

| Endpoint | Auth Required | Purpose |
|----------|---------------|---------|
| `POST /oauth/token` | ❌ Public | Get service access token |
| `POST /api/v1/services/notifications/send` | ✅ Service Token | Send notifications |

## Best Practices
- **Cache the Token**: Tokens are valid for 2 hours. Cache and reuse until expiry.
- **Retry Logic**: If you receive `401 Unauthorized`, your token may have expired. Request a new token and retry.
- **Use Basic Auth**: For production, use Basic Auth header instead of sending credentials in request body.
- **HTTPS Only**: Always use HTTPS to protect your credentials.
- **Rate Limiting**: Implement exponential backoff for retries.
