# Native Bridge Usage Guide

## Overview
The SuperApp provides a native bridge that allows microapps to communicate with the parent React Native application. This includes accessing user information like Employee ID (empID).

## Available Data

### Employee ID (empID)
The employee ID of the currently logged-in user is automatically made available to microapps.

## Accessing Employee ID

### Method 1: Direct Access
```javascript
// Get empID directly (available after bridge initialization)
const empId = window.nativebridge.getEmpId();
console.log('Employee ID:', empId);
```

### Method 2: Request from Native App
```javascript
// Request empID from native app
window.nativebridge.requestEmpId();

// Listen for response
window.addEventListener('nativeEmpIdReceived', (event) => {
    const empId = event.detail;
    console.log('Received Employee ID:', empId);
});
```

### Method 3: Check Global Variable
```javascript
// Check if empID is available in global scope
if (window.nativeEmpId) {
    console.log('Employee ID:', window.nativeEmpId);
}
```

## React Component Example

```jsx
import React, { useState, useEffect } from 'react';

function MyMicroApp() {
    const [employeeId, setEmployeeId] = useState(null);

    useEffect(() => {
        // Method 1: Try to get empID directly
        const getNativeEmpId = () => {
            if (window.nativebridge && window.nativebridge.getEmpId) {
                const nativeEmpId = window.nativebridge.getEmpId();
                if (nativeEmpId) {
                    setEmployeeId(nativeEmpId);
                    return nativeEmpId;
                }
            }
            
            // Method 2: Request empID if not available
            if (window.nativebridge && window.nativebridge.requestEmpId) {
                window.nativebridge.requestEmpId();
            }
            
            return null;
        };

        // Method 3: Listen for empID updates
        const handleEmpIdReceived = (event) => {
            setEmployeeId(event.detail);
        };

        window.addEventListener('nativeEmpIdReceived', handleEmpIdReceived);
        getNativeEmpId();

        return () => {
            window.removeEventListener('nativeEmpIdReceived', handleEmpIdReceived);
        };
    }, []);

    return (
        <div>
            <h1>My Micro App</h1>
            {employeeId ? (
                <p>Employee ID: {employeeId}</p>
            ) : (
                <p>Loading employee information...</p>
            )}
        </div>
    );
}

export default MyMicroApp;
```

## Other Available Bridge Functions

- `window.nativebridge.getToken()` - Get authentication token
- `window.nativebridge.requestAlert(title, message, buttonText)` - Show native alert
- `window.nativebridge.requestSaveLocalData(key, value)` - Save data locally
- `window.nativebridge.requestGetLocalData(key)` - Get saved data

## Best Practices

1. **Always check for bridge availability** before using it
2. **Use event listeners** for dynamic updates
3. **Provide fallbacks** when bridge is not available
4. **Handle errors gracefully** when bridge functions fail

## Testing

During development, you can test empID functionality by:
1. Using the default fallback empID
2. Mocking the bridge in your development environment
3. Testing with different employee IDs

```javascript
// Development mock
if (!window.nativebridge) {
    window.nativebridge = {
        getEmpId: () => 'EMP001', // Mock empID for testing
        requestEmpId: () => console.log('Mock: empID requested')
    };
}
```
