# Microapp Token Integration Guide

## Overview

This guide explains how microapps can request and use microapp-specific tokens from the backend.

## Service Function

The `fetchMicroAppToken` function is available in `/services/microAppTokenService.ts` and allows fetching microapp tokens from the backend using:

- **URL**: `${BASE_URL}/micro-app-token?emp_id=${emp_id}&micro_app_id=${app_id}`
- **Parameters**: 
  - `emp_id`: Employee ID of the current user
  - `app_id`: ID of the microapp requesting the token

## Bridge Integration

The microapp token functionality is integrated with the bridge communication system. There are several ways to pass the `app_id` parameter:

### Method 1: Explicit app_id parameter (Recommended)
```javascript
// In your microapp code - pass app_id explicitly
window.nativebridge.requestMicroAppToken({ app_id: "payslip-viewer" });

// Listen for successful response
window.addEventListener('resolveMicroAppToken', (event) => {
  const { token, expiresAt, app_id } = event.detail;
  console.log(`Received microapp token for ${app_id}:`, token);
  // Use the token for authenticated requests
});

// Listen for error response
window.addEventListener('rejectMicroAppToken', (event) => {
  const error = event.detail;
  console.error('Failed to get microapp token:', error);
});
```

### Method 2: Automatic app_id detection (Future Enhancement)
If the microapp URL contains the app_id in the URL parameters, it could be automatically detected:
```javascript
// The system could auto-detect app_id from URL like:
// http://localhost:3000/payslip-viewer?app_id=payslip-viewer
window.nativebridge.requestMicroAppToken(); // app_id auto-detected
```

### Method 3: Using URL-based app_id extraction
The app_id can be extracted from the current microapp's URL:
```javascript
// Extract app_id from current URL
const urlParams = new URLSearchParams(window.location.search);
const app_id = urlParams.get('app_id') || 'default-app-id';

window.nativebridge.requestMicroAppToken({ app_id });
```

### Method 4: Environment-based app_id
For development, you can set the app_id as an environment variable or constant:
```javascript
// In your microapp's config or environment
const APP_ID = process.env.REACT_APP_ID || 'payslip-viewer';

window.nativebridge.requestMicroAppToken({ app_id: APP_ID });
```

## Automatic Token Fetching

When a microapp is clicked and requires a token, the system automatically:

1. Detects if the microapp needs a token (based on configuration)
2. Fetches the token using the current employee ID and app ID
3. Provides the token to the microapp through the bridge

## Backend API

The backend should provide an endpoint at:

```
GET /micro-app-token?emp_id=EMP004&micro_app_id=payslip-viewer
```

Expected response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": 1640995200000
}
```

## Error Handling

The service includes comprehensive error handling for:
- Missing parameters
- Network errors
- Server errors
- Invalid responses

All errors are properly logged and communicated back to the microapp through the bridge system.