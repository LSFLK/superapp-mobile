# Bridge Communication Guide

## Overview

The Bridge is a communication layer that enables secure, bidirectional messaging between the SuperApp (React Native) and embedded MicroApps (web applications running in WebViews). This architecture allows MicroApps to access native device capabilities and SuperApp services while maintaining security boundaries.

### Underlying Technology

The Bridge leverages React Native's WebView component and the `postMessage` API for cross-context communication:

- **Message Passing**: Uses `window.ReactNativeWebView.postMessage()` for MicroApp → SuperApp communication
- **Event System**: Custom DOM events for SuperApp → MicroApp responses
- **Type Safety**: Auto-generated TypeScript definitions ensure compile-time safety
- **Registry Pattern**: Centralized function registry for maintainable bridge management

### Architecture

```
┌─────────────────┐    postMessage    ┌─────────────────┐
│   MicroApp      │ ────────────────► │   SuperApp      │
│   (WebView)     │                   │   (React Native)│
│                 │ ◄───────────────  │                 │
└─────────────────┘   Custom Events   └─────────────────┘
```

## Developer Roles

### SuperApp Developer
Responsible for maintaining the bridge infrastructure and implementing native functionality. This includes:
- Adding new bridge functions to the registry
- Implementing native handlers with device/platform access
- Managing security and permissions
- Updating bridge types and documentation

### MicroApp Developer
Develops web applications that integrate with the SuperApp through the bridge. Responsibilities include:
- Using bridge APIs to access native features
- Handling asynchronous responses via event listeners
- Managing bridge state and error conditions
- Following security best practices for cross-origin communication

## For SuperApp Developers: Adding Bridge Functions

### Bridge Function Structure

Each bridge function is defined in `frontend/utils/bridgeRegistry.ts` with the following interface:

```typescript
interface BridgeFunction {
  topic: string;                    // Unique identifier for the function
  handler: (params: any, context: BridgeContext) => Promise<void> | void;
  webViewMethods: {
    request?: string;              // Method name exposed to MicroApps
    resolve?: string;              // Success event name
    reject?: string;               // Error event name
    helper?: string;               // Synchronous getter method name
  };
}
```

### Context Object

The handler receives a `BridgeContext` with:

```typescript
interface BridgeContext {
  empID: string;                              // Current user's employee ID
  appID: string;                              // Current MicroApp ID
  token: string | null;                       // Authentication token
  setScannerVisible: (visible: boolean) => void; // Control QR scanner visibility
  sendResponseToWeb: (method: string, data?: any) => void; // Send response to MicroApp
  pendingTokenRequests: ((token: string) => void)[]; // Token request queue
}
```

### Adding a New Bridge Function

1. **Define the function in the registry**:

```typescript
// In frontend/utils/bridgeRegistry.ts
{
  topic: "get_device_info",
  handler: async (params, context) => {
    try {
      const deviceInfo = {
        platform: Platform.OS,
        version: Platform.Version,
        model: Device.modelName
      };
      context.sendResponseToWeb("resolveDeviceInfo", deviceInfo);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      context.sendResponseToWeb("rejectDeviceInfo", errorMessage);
    }
  },
  webViewMethods: {
    request: "requestDeviceInfo",
    resolve: "resolveDeviceInfo",
    reject: "rejectDeviceInfo"
  }
}
```

2. **Update TypeScript definitions** (auto-generated, but verify in `types/bridge.types.ts`)

3. **Test the implementation** with a MicroApp

### Best Practices for SuperApp Developers

- **Use descriptive topic names**: Prefer `get_user_profile` over `get_data`
- **Implement proper error handling**: Always wrap operations in try/catch
- **Validate parameters**: Check required fields before processing
- **Use async/await**: For operations that may block the UI thread
- **Log operations**: Include console logging for debugging
- **Follow naming conventions**: `requestX` → `resolveX` / `rejectX`

## For MicroApp Developers: Using Bridge APIs

### Initialization

The bridge is automatically injected into MicroApps via WebView JavaScript injection. Access it through:

```javascript
// Check if bridge is available
if (window.nativebridge) {
  // Bridge is ready to use
}
```

### Making Requests

All bridge functions follow an asynchronous request-response pattern:

```javascript
// Request operation
window.nativebridge.requestToken();

// Listen for response
window.addEventListener('resolveToken', (event) => {
  const token = event.detail;
  console.log('Received token:', token);
});

// Listen for errors
window.addEventListener('rejectToken', (event) => {
  const error = event.detail;
  console.error('Token request failed:', error);
});
```

### Synchronous Helpers

Some bridge functions provide synchronous getter methods for cached data:

```javascript
// Get cached token (if available)
const token = window.nativebridge.getToken();
if (token) {
  // Use cached token
} else {
  // Request fresh token
  window.nativebridge.requestToken();
}
```

### Event Handling Best Practices

- **Use unique event listeners**: Avoid duplicate listeners for the same event
- **Clean up listeners**: Remove event listeners when components unmount
- **Handle both resolve and reject**: Always implement error handling
- **Type event data**: Use TypeScript for better development experience

```javascript
// Example with proper cleanup
useEffect(() => {
  const handleResolve = (event) => {
    const data = event.detail;
    // Process data
  };

  const handleReject = (event) => {
    const error = event.detail;
    // Handle error
  };

  window.addEventListener('resolveMyFunction', handleResolve);
  window.addEventListener('rejectMyFunction', handleReject);

  return () => {
    window.removeEventListener('resolveMyFunction', handleResolve);
    window.removeEventListener('rejectMyFunction', handleReject);
  };
}, []);
```

## Available Bridge Functions

### Authentication & Identity

#### Token Management
- **Request**: `window.nativebridge.requestToken()`
- **Resolve Event**: `resolveToken` (data: string)
- **Helper**: `window.nativebridge.getToken()` → string | null
- **Purpose**: Retrieve authentication token for API calls

#### Employee ID
- **Request**: `window.nativebridge.requestEmpId()`
- **Resolve Event**: `resolveEmpId` (data: string)
- **Helper**: `window.nativebridge.getEmpId()` → string | null
- **Purpose**: Get current user's employee identifier

#### MicroApp Token
- **Request**: `window.nativebridge.requestMicroAppToken()`
- **Resolve Event**: `resolveMicroAppToken` (data: {token: string, expiresAt: string, app_id: string})
- **Reject Event**: `rejectMicroAppToken` (error: string)
- **Purpose**: Get app-specific authentication token

### User Interface

#### Alert Dialog
- **Request**: `window.nativebridge.requestAlert(title, message, buttonText)`
- **Purpose**: Display native alert dialog

#### Confirmation Dialog
- **Request**: `window.nativebridge.requestConfirmAlert(title, message, confirmButtonText, cancelButtonText)`
- **Resolve Event**: `resolveConfirmAlert` (data: "confirm" | "cancel")
- **Purpose**: Display native confirmation dialog

### Device Features

#### QR Code Scanner
- **Request**: `window.nativebridge.requestQr()`
- **Purpose**: Activate native QR code scanner
- **Note**: Listen for scanner-specific events (implementation-dependent)

### Data Storage

#### Save Local Data
- **Request**: `window.nativebridge.requestSaveLocalData(key, value)`
- **Resolve Event**: `resolveSaveLocalData`
- **Reject Event**: `rejectSaveLocalData` (error: string)
- **Purpose**: Persist data using AsyncStorage

#### Get Local Data
- **Request**: `window.nativebridge.requestGetLocalData(key)`
- **Resolve Event**: `resolveGetLocalData` (data: {value: string | null})
- **Reject Event**: `rejectGetLocalData` (error: string)
- **Purpose**: Retrieve persisted data

## Security Considerations

- **Input Validation**: Always validate parameters from MicroApps
- **Permission Checks**: Verify user permissions before executing sensitive operations
- **Token Security**: Never log or expose tokens in plain text
- **Cross-Origin**: Bridge only works within authorized WebViews
- **Data Sanitization**: Clean user inputs before processing

## Troubleshooting

### Common Issues

1. **Bridge not available**: Ensure WebView has finished loading and bridge is injected
2. **Events not firing**: Check event listener attachment and naming
3. **TypeScript errors**: Regenerate types after adding new functions
4. **Async operations failing**: Verify proper async/await usage in handlers

### Debugging Steps

1. **Check console logs**: Both native and web consoles show bridge activity
2. **Verify function registration**: Ensure topic names match exactly
3. **Test event listeners**: Use browser dev tools to inspect attached listeners
4. **Network monitoring**: Look for postMessage calls in network tab

### Error Messages

- `"app_id parameter is required"`: MicroApp token request missing app ID
- `"Employee ID is not available"`: User context not properly initialized
- `"Unknown error"`: Generic error, check native console for details

## Migration Guide

When updating bridge functions:

1. **Add new function** to registry (maintains backward compatibility)
2. **Update MicroApps** to use new functions
3. **Remove deprecated functions** after all MicroApps updated
4. **Update documentation** and TypeScript definitions

## Support

For bridge-related issues:
- Check this documentation first
- Review console logs for error messages
- Verify function implementation in registry
- Test with minimal reproduction case

---

*This guide is maintained by the SuperApp development team. Last updated: September 2025*</content>.  
<parameter name="filePath">superapp-mobile/docs/BRIDGE_GUIDE.md

<br>.  
----
# Additional Information :


## SuperApp - MicroApp Flow

### The Process:

1. **MicroApp Makes Request** (via postMessage):
```javascript
// In MicroApp
window.nativebridge.requestToken();
```

2. **SuperApp Receives & Processes** (in React Native):
```typescript
// In micro-app.tsx - onMessage handler
const onMessage = async (event: WebViewMessageEvent) => {
  const { topic, data } = JSON.parse(event.nativeEvent.data);
  const handler = getBridgeHandler(topic);
  // Execute the handler...
};
```

3. **SuperApp Sends Response** (via JavaScript injection):
```typescript
// sendResponseToWeb function in micro-app.tsx
const sendResponseToWeb = (method: string, data?: any) => {
  webviewRef.current?.injectJavaScript(
    `window.nativebridge.${method}(${JSON.stringify(data)});`
  );
};

// Handler calls this:
context.sendResponseToWeb("resolveToken", token);
```

4. **Injected JavaScript Creates Custom Event** (in WebView):
```javascript
// Auto-generated injected JavaScript (from bridge.ts)
window.nativebridge = {
  resolveToken: (data) => {
    console.log("token resolved:", data);
    window.dispatchEvent(new CustomEvent('resolveToken', { detail: data }));
  },
  // ...
};
```

5. **MicroApp Receives via Event Listener**:
```javascript
// In MicroApp
window.addEventListener('resolveToken', (event) => {
  const token = event.detail; // The actual data
  console.log('Received token:', token);
});
```


### Why Custom Events?

- **Asynchronous**: Allows MicroApps to respond to events at any time
- **Decoupled**: MicroApp doesn't need to know when the response will arrive
- **Standard Web API**: Uses native DOM events that web developers are familiar with
- **Multiple Listeners**: Multiple parts of the MicroApp can listen to the same event

This creates a clean, event-driven architecture where the SuperApp can send responses back to the MicroApp asynchronously, just like how web APIs work! 🚀