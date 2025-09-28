# Bridge Communication Guide

## Overview

The Bridge is a communication layer that enables secure, bidirectional messaging between the SuperApp (React Native) and embedded MicroApps (web applications running in WebViews). This architecture allows MicroApps to access native device capabilities and SuperApp services while maintaining security boundaries.

### Underlying Technology

The Bridge leverages React Native's WebView component and the `postMessage` API for cross-context communication:

- **Message Passing**: Uses `window.ReactNativeWebView.postMessage()` for MicroApp → SuperApp communication
- **Promise System**: Promise-based responses for SuperApp → MicroApp communication
- **Type Safety**: Auto-generated TypeScript definitions ensure compile-time safety
- **Registry Pattern**: Centralized function registry for maintainable bridge management

### Architecture

```
┌─────────────────┐    postMessage    ┌─────────────────┐
│   MicroApp      │ ────────────────► │   SuperApp      │
│   (WebView)     │                   │   (React Native)│
│                 │ ◄───────────────  │                 │
└─────────────────┘     Promises      └─────────────────┘
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
- Using bridge APIs to access native features via promises
- Handling asynchronous responses with async/await
- Managing bridge state and error conditions
- Following security best practices for cross-origin communication

## For SuperApp Developers: Adding Bridge Functions

### Bridge Function Structure

Each bridge function is defined in `frontend/utils/bridgeRegistry.ts` with the following interface:

```typescript
interface BridgeFunction {
  topic: string;                    // Unique identifier for the function
  handler: (params: any, context: BridgeContext) => Promise<void> | void;
  // Method names are auto-generated from topic:
  // - request: `request${capitalize(topic)}`
  // - resolve: `resolve${capitalize(topic)}`
  // - reject: `reject${capitalize(topic)}`
  // - helper: `get${capitalize(topic)}`
}
```

### Context Object

The handler receives a `BridgeContext` object, which provides convenient access to relevant data and utility methods for bridge operations. This context includes:

```typescript
interface BridgeContext {
  topic: string;                              // Current bridge topic (auto-injected)
  empID: string;                              // Current user's employee ID
  appID: string;                              // Current MicroApp ID
  token: string | null;                       // Authentication token
  setScannerVisible: (visible: boolean) => void; // Control QR scanner visibility
  sendResponseToWeb: (method: string, data?: any) => void; // Send response to MicroApp
  pendingTokenRequests: ((token: string) => void)[]; // Token request queue
  // Convenience methods that auto-generate method names from topic
  resolve: (data?: any, requestId?: string) => void; // Auto-generates resolve method name
  reject: (error: string, requestId?: string) => void; // Auto-generates reject method name
}
```


### Adding a New Bridge Function

Each bridge function lives in its own file under `frontend/utils/bridgeHandlers/`, and `frontend/utils/bridgeHandlers/index.ts` aggregates all handlers into the `BRIDGE_REGISTRY` array which the runtime uses.

1. Create a handler file:

- Path: `frontend/utils/bridgeHandlers/<your_topic>.ts`
- Export a `BRIDGE_FUNCTION` object with `topic` and `handler`. Example template:

```ts
// frontend/utils/bridgeHandlers/example_handler.ts
import { BridgeFunction, BridgeContext } from './bridgeTypes';

export const BRIDGE_FUNCTION: BridgeFunction = {
  topic: 'example_topic',
  handler: async (params: any, context: BridgeContext) => {
    try {
      if (!params) {
        context.reject('Missing parameters');
        return;
      }

      // Your logic here
      const result = { ok: true, received: params };
      context.resolve(result);
    } catch (err) {
      context.reject(err instanceof Error ? err.message : String(err));
    }
  }
};
```

2. Register the handler:

- Import the new file in `frontend/utils/bridgeHandlers/index.ts` and include the exported `BRIDGE_FUNCTION` in the exported `BRIDGE_REGISTRY` array. The registry file is imported by the runtime (`frontend/utils/bridgeRegistry.ts`) so no further changes are necessary.

Smoke test by invoking your bridge function from a micro-app or by loading the WebView and calling `window.nativebridge.request<YourMethod>()`.

### Best Practices for SuperApp Developers

- **Use descriptive topic names**: Prefer `get_user_profile` over `get_data`
- **Implement proper error handling**: Always wrap operations in try/catch
- **Validate parameters**: Check required fields before processing
- **Use async/await**: For operations that may block the UI thread
- **Log operations**: Include console logging for debugging

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

All bridge functions now return promises for cleaner asynchronous handling:

```javascript
// Request token with promise-based API
try {
  const token = await window.nativebridge.requestToken();
  console.log('Received token:', token);
} catch (error) {
  console.error('Token request failed:', error);
}

// Request user ID
try {
  const userId = await window.nativebridge.requestUserId();
  console.log('User ID:', userId);
} catch (error) {
  console.error('Failed to get user ID:', error);
}
```

### Promise-based Best Practices

- **Use async/await**: For cleaner, more readable asynchronous code
- **Handle errors**: Always wrap bridge calls in try/catch blocks
- **Type responses**: Use TypeScript for better development experience
- **Avoid blocking**: Don't call bridge functions in render loops

```javascript
// Example with proper error handling
async function loadUserData() {
  try {
    const [token, userId] = await Promise.all([
      window.nativebridge.requestToken(),
      window.nativebridge.requestUserId()
    ]);
    
    // Use token and userId
    console.log('User authenticated:', { token, userId });
  } catch (error) {
    console.error('Failed to load user data:', error);
    // Handle error appropriately
  }
}
```

## Available Bridge Functions

### Authentication & Identity

#### Token Management
- **Request**: `await window.nativebridge.requestToken()` → `Promise<string>`
- **Helper**: `window.nativebridge.getToken()` → `string | null`
- **Purpose**: Retrieve authentication token for API calls

#### User ID
- **Request**: `await window.nativebridge.requestUserId()` → `Promise<string>`
- **Purpose**: Get current user's identifier

#### MicroApp Token
- **Request**: `await window.nativebridge.requestMicroAppToken(params)` → `Promise<{token: string, expiresAt: string, app_id: string}>`
- **Purpose**: Get app-specific authentication token

### User Interface

#### Alert Dialog
- **Request**: `window.nativebridge.requestAlert(title, message, buttonText)`
- **Purpose**: Display native alert dialog (fire-and-forget)

#### Confirmation Dialog
- **Request**: `await window.nativebridge.requestConfirmAlert(title, message, confirmButtonText, cancelButtonText)` → `Promise<"confirm" | "cancel">`
- **Purpose**: Display native confirmation dialog

### Device Features

#### QR Code Scanner
- **Request**: `window.nativebridge.requestQr()`
- **Purpose**: Activate native QR code scanner
- **Note**: Listen for scanner-specific events (implementation-dependent)

### Data Storage

#### Save Local Data
- **Request**: `await window.nativebridge.requestSaveLocalData(key, value)` → `Promise<void>`
- **Purpose**: Persist data using AsyncStorage

#### Get Local Data
- **Request**: `await window.nativebridge.requestGetLocalData(key)` → `Promise<{value: string | null}>`
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
2. **Promises not resolving**: Check that bridge methods are called correctly with await
3. **TypeScript errors**: Regenerate types after adding new functions
4. **Async operations failing**: Verify proper async/await usage in handlers

### Debugging Steps

1. **Check console logs**: Both native and web consoles show bridge activity
2. **Verify function registration**: Ensure topic names match exactly
3. **Test promise resolution**: Use browser dev tools to inspect promise states
4. **Network monitoring**: Look for postMessage calls in network tab


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