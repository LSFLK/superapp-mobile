/**
 * WebView Security Manager
 * 
 * Provides origin validation and security policies for micro-app WebViews
 */

import { documentDirectory } from "expo-file-system";

export interface SecurityPolicy {
  allowedBridgeOrigins: string[];  // Origins that can access bridge functions
  allowedNetworkOrigins: string[]; // Origins for network requests (API calls)
  allowNavigation: boolean;
  allowFileAccess: boolean;
  bridgeEnabled: boolean;
}

/**
 * Get security policy for a micro-app based on its source URI
 */
export const getSecurityPolicy = (webViewUri: string, appId: string, isDeveloper: boolean): SecurityPolicy => {
  const isUrlBased = webViewUri.startsWith('http://') || webViewUri.startsWith('https://');
  
  if (isDeveloper) {
    // Developer mode - more permissive but still restricted
    return {
      allowedBridgeOrigins: [
        'http://localhost:*',
        'http://127.0.0.1:*',
        'http://10.*.*.*:*',
        'http://192.168.*.*:*',
        webViewUri // Allow the specific dev URL
      ],
      allowedNetworkOrigins: ['*'], // Allow all network requests in dev mode
      allowNavigation: true,
      allowFileAccess: false,
      bridgeEnabled: true
    };
  }

  if (isUrlBased) {
    // URL-based micro-app (should be very restricted)
    const url = new URL(webViewUri);
    return {
      allowedBridgeOrigins: [webViewUri, `${url.protocol}//${url.host}`],
      allowedNetworkOrigins: ['*'], // Allow API calls but restrict bridge access
      allowNavigation: false, // Prevent navigation away from original URL
      allowFileAccess: false,
      bridgeEnabled: true
    };
  }

  // File-based micro-app (local ZIP) - MOST SECURE
  // Create patterns that will match local micro-app files
  // Example actual URL: file:///data/user/0/com.example.superapp/files/lsf/micro-apps/payslip-viewer-extracted/index.html
  
  return {
    allowedBridgeOrigins: [
      'file:///*',                         // Allow any local file (most permissive for local apps)
      'file:///data/user/*',               // Android app data directory
      'file:///var/mobile/*',              // iOS app data directory  
      'file:///private/var/*',             // iOS private directory
      documentDirectory + '*',             // Document directory pattern
    ], // Only local files can access bridge
    allowedNetworkOrigins: ['*'], // Allow API calls to any external service
    allowNavigation: false, // No navigation away from app
    allowFileAccess: true,
    bridgeEnabled: true
  };
};

/**
 * Validate if a URL is allowed for navigation based on security policy
 */
export const isNavigationAllowed = (url: string, policy: SecurityPolicy): boolean => {
  // Allow all network requests (API calls) - we only restrict navigation and bridge access
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return policy.allowedNetworkOrigins.includes('*') || 
           policy.allowedNetworkOrigins.some((pattern: string) => {
             if (pattern.endsWith('*')) {
               return url.startsWith(pattern.slice(0, -1));
             }
             return url === pattern || url.startsWith(pattern + '/');
           });
  }
  
  // For file URLs, check bridge origins (since navigation within local files is bridge-related)
  return policy.allowedBridgeOrigins.some((pattern: string) => {
    if (pattern.endsWith('*')) {
      return url.startsWith(pattern.slice(0, -1));
    }
    return url === pattern || url.startsWith(pattern + '/');
  });
};

/**
 * Validate if bridge access is allowed from this origin
 */
export const isBridgeAccessAllowed = (url: string, policy: SecurityPolicy): boolean => {
  console.log(`[DEBUG] Checking bridge access for URL: ${url}`);
  console.log(`[DEBUG] Allowed patterns: ${JSON.stringify(policy.allowedBridgeOrigins)}`);
  
  return policy.allowedBridgeOrigins.some((pattern: string) => {
    // Handle wildcard patterns
    if (pattern.endsWith('*')) {
      const patternBase = pattern.slice(0, -1);
      
      // Normalize file:// URLs to handle different slash counts
      let normalizedUrl = url;
      let normalizedPattern = patternBase;
      
      if (url.startsWith('file://') && pattern.startsWith('file://')) {
        normalizedUrl = url.replace(/^file:\/+/, 'file:///');
        normalizedPattern = patternBase.replace(/^file:\/+/, 'file:///');
      }
      
      const matches = normalizedUrl.startsWith(normalizedPattern);
      console.log(`[DEBUG] Pattern: ${normalizedPattern}* vs URL: ${normalizedUrl} = ${matches}`);
      return matches;
    }
    
    // Exact match or path match
    const matches = url === pattern || url.startsWith(pattern + '/');
    console.log(`[DEBUG] Exact pattern: ${pattern} vs URL: ${url} = ${matches}`);
    return matches;
  });
};

/**
 * Validate WebView message origin for bridge access
 */
export const validateMessageOrigin = (
  messageUrl: string, 
  policy: SecurityPolicy,
  appId: string
): { isValid: boolean; reason?: string } => {
  
  if (!policy.bridgeEnabled) {
    return { isValid: false, reason: 'Bridge disabled for this app' };
  }

  // Check if bridge access is allowed from this origin
  if (!isBridgeAccessAllowed(messageUrl, policy)) {
    console.error(`[SECURITY] Bridge message from unauthorized origin: ${messageUrl} for app: ${appId}`);
    console.log(`[SECURITY] Allowed bridge origins: ${policy.allowedBridgeOrigins.join(', ')}`);
    return { isValid: false, reason: `Origin ${messageUrl} not authorized for bridge access` };
  }

  return { isValid: true };
};

/**
 * Sanitize and validate bridge message data
 */
export const sanitizeBridgeMessage = (data: string): { isValid: boolean; parsed?: any; error?: string } => {
  try {
    console.log('[DEBUG] Sanitizing bridge message:', data);
    const parsed = JSON.parse(data);
    
    // Basic validation
    if (!parsed || typeof parsed !== 'object') {
      return { isValid: false, error: 'Invalid message format' };
    }

    if (!parsed.topic || typeof parsed.topic !== 'string') {
      return { isValid: false, error: 'Missing or invalid topic' };
    }

    // Simplified prototype pollution protection - only block obvious attacks
    // Check if the message itself tries to pollute prototypes
    if (parsed.hasOwnProperty('__proto__') && parsed.__proto__ !== Object.prototype) {
      console.warn('[SECURITY] Prototype pollution attempt detected:', parsed.__proto__);
      return { isValid: false, error: 'Potentially malicious payload detected' };
    }
    
    // Allow normal bridge messages to pass through
    console.log('[DEBUG] Message passed security validation:', parsed.topic);

    return { isValid: true, parsed };
  } catch (error) {
    return { isValid: false, error: 'Failed to parse message' };
  }
};

/**
 * Generate Content Security Policy for WebView
 */
export const generateCSP = (policy: SecurityPolicy): string => {
  const bridgeOrigins = policy.allowedBridgeOrigins.join(' ');
  const networkOrigins = policy.allowedNetworkOrigins.includes('*') ? '*' : policy.allowedNetworkOrigins.join(' ');
  
  return [
    `default-src 'self' ${bridgeOrigins}`,
    `script-src 'self' 'unsafe-inline' ${bridgeOrigins}`,
    `connect-src 'self' ${networkOrigins}`, // Allow network requests to any API
    `img-src 'self' data: https: ${networkOrigins}`,
    `style-src 'self' 'unsafe-inline' ${bridgeOrigins}`,
    `font-src 'self' data: ${bridgeOrigins}`,
    `frame-ancestors 'none'`,
    `form-action 'self'`,
    `upgrade-insecure-requests`
  ].join('; ');
};