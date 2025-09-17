# Native Bridge Guide

**Want to add a new bridge function? You only need to edit ONE file: `utils/bridgeRegistry.ts`**

That's it! Everything else is auto-generated:
- ✅ Native message handling
- ✅ WebView JavaScript injection  
- ✅ TypeScript definitions
- ✅ Error handling

## 🚀 Adding a New Bridge Function (Super Easy!)

### Step 1: Add to Registry (Only step needed!)

Open `frontend/utils/bridgeRegistry.ts` and add your function to the `BRIDGE_REGISTRY` array:

```typescript
// In bridgeRegistry.ts - ADD YOUR FUNCTION HERE
{
  topic: "get_device_info",
  handler: async (params, context) => {
    const deviceInfo = {
      platform: Platform.OS,
      version: Platform.Version,
      model: Device.modelName // if using expo-device
    };
    context.sendResponseToWeb("resolveDeviceInfo", deviceInfo);
  },
  webViewMethods: {
    request: "requestDeviceInfo",
    resolve: "resolveDeviceInfo"
  }
}
```

### Step 2: There is no Step 2! 🎉

That's literally it. Your function is now available in all microapps as:

```javascript
// In your microapp
window.nativebridge.requestDeviceInfo();

// Listen for response
window.addEventListener('resolveDeviceInfo', (event) => {
  console.log('Device info:', event.detail);
});
```

## 🔧 Bridge Function Anatomy

Each bridge function has this simple structure:

```typescript
{
  topic: "your_topic_name",           // Unique identifier
  handler: async (params, context) => {
    // Your native logic here
    // params = data sent from microapp
    // context = { empID, token, setScannerVisible, sendResponseToWeb, pendingTokenRequests }
    
    // Send response back to microapp
    context.sendResponseToWeb("resolveYourFunction", result);
  },
  webViewMethods: {
    request: "requestYourFunction",   // Method name in microapp
    resolve: "resolveYourFunction",   // Optional: success callback
    reject: "rejectYourFunction",     // Optional: error callback  
    helper: "getYourData"             // Optional: sync getter method
  }
}
```

## 📚 Real Examples

### Example 1: Simple Data Request
```typescript
{
  topic: "get_user_settings",
  handler: async (params, context) => {
    const settings = await getUserSettings(context.empID);
    context.sendResponseToWeb("resolveUserSettings", settings);
  },
  webViewMethods: {
    request: "requestUserSettings",
    resolve: "resolveUserSettings"
  }
}
```

Usage in microapp:
```javascript
window.nativebridge.requestUserSettings();
window.addEventListener('resolveUserSettings', (event) => {
  console.log('User settings:', event.detail);
});
```

### Example 2: Function with Parameters
```typescript
{
  topic: "send_notification",
  handler: async (params, context) => {
    const { title, message, urgent } = params;
    try {
      await sendPushNotification(title, message, urgent);
      context.sendResponseToWeb("resolveNotification");
    } catch (error) {
      context.sendResponseToWeb("rejectNotification", error.message);
    }
  },
  webViewMethods: {
    request: "requestNotification",
    resolve: "resolveNotification", 
    reject: "rejectNotification"
  }
}
```

Usage in microapp:
```javascript
window.nativebridge.requestNotification({
  title: "Hello!",
  message: "This is a test notification",
  urgent: false
});

window.addEventListener('resolveNotification', () => {
  console.log('Notification sent successfully');
});

window.addEventListener('rejectNotification', (event) => {
  console.error('Failed to send notification:', event.detail);
});
```

### Example 3: Helper Function (Sync Access)
```typescript
{
  topic: "app_version",
  handler: async (params, context) => {
    const version = getAppVersion();
    context.sendResponseToWeb("resolveAppVersion", version);
  },
  webViewMethods: {
    request: "requestAppVersion",
    resolve: "resolveAppVersion",
    helper: "getAppVersion"  // Creates window.nativebridge.getAppVersion()
  }
}
```

Usage in microapp:
```javascript
// Sync access (if data is already available)
const version = window.nativebridge.getAppVersion();

// Or request fresh data
window.nativebridge.requestAppVersion();
```

## 🛠️ Available Context Properties

In your handler function, you have access to:

```typescript
interface BridgeContext {
  empID: string;                              // Current user's employee ID
  token: string | null;                       // Current auth token
  setScannerVisible: (visible: boolean) => void; // Show/hide QR scanner
  sendResponseToWeb: (method: string, data?: any) => void; // Send data to microapp
  pendingTokenRequests: ((token: string) => void)[]; // Token request queue
}
```

## 🎨 Best Practices

### ✅ DO:
- Use descriptive topic names: `get_user_profile`, `save_document`
- Handle errors gracefully with try/catch
- Use consistent naming: `requestX` → `resolveX` / `rejectX`
- Add helpful console.log messages for debugging

### ❌ DON'T:
- Use generic names like `data`, `info`, `stuff`
- Forget error handling
- Make blocking operations without async/await
- Modify multiple files (you only need bridgeRegistry.ts!)

## 🔍 Debugging Tips

1. **Check Console**: Both native and web console will show bridge messages
2. **Network Tab**: Look for `ReactNativeWebView.postMessage` calls
3. **Event Listeners**: Make sure microapp is listening for the right events
4. **Topic Names**: Ensure topic name matches exactly (case-sensitive)


## 📝 TypeScript Support

TypeScript definitions are automatically available at `types/bridge.types.ts`. 

To use in your microapps:
```typescript
// Reference the types in your microapp
/// <reference path="./types/bridge.types.ts" />

// Now you get full autocomplete!
window.nativebridge.requestUserSettings();
```

**Happy coding! 🚀**