import { BRIDGE_REGISTRY } from './bridgeRegistry';

/**
 * Bridge Utility for WebView Communication
 *
 * This module auto-generates JavaScript code that gets injected into WebViews to enable
 * bidirectional communication between React Native and web micro-apps.
 *
 */

export const generateInjectedJavaScript = () => {
  const methods: string[] = [];
  const globalHelpers: string[] = [];

  // Generate methods for each bridge function
  BRIDGE_REGISTRY.forEach(bridgeFunction => {
    const { topic, webViewMethods } = bridgeFunction;

    /**
     * Generate request method - returns a promise that resolves/rejects based on native response
     * This creates window.nativebridge.someMethod(data) that posts messages to React Native
     * and returns a promise that will be resolved when native responds
     */
    if (webViewMethods.request) {
      methods.push(`
    ${webViewMethods.request}: (data) => {
      return new Promise((resolve, reject) => {
        const requestId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Store the promise resolvers
        if (!window.nativebridge._pendingPromises) {
          window.nativebridge._pendingPromises = {};
        }
        window.nativebridge._pendingPromises[requestId] = { resolve, reject };
        
        // Post message to React Native with request ID
        window.ReactNativeWebView.postMessage(JSON.stringify({
          topic: '${topic}',
          data: data,
          requestId: requestId
        }));
      });
    },`);
    }

    /**
     * Generate resolve method - resolves the corresponding promise
     */
    if (webViewMethods.resolve) {
      methods.push(`
    ${webViewMethods.resolve}: (data, requestId) => {
      console.log("${topic} resolved:", data);
      if (window.nativebridge._pendingPromises && window.nativebridge._pendingPromises[requestId]) {
        window.nativebridge._pendingPromises[requestId].resolve(data);
        delete window.nativebridge._pendingPromises[requestId];
      }
    },`);
    }

    /**
     * Generate reject method - rejects the corresponding promise
     */
    if (webViewMethods.reject) {
      methods.push(`
    ${webViewMethods.reject}: (error, requestId) => {
      console.error("${topic} failed:", error);
      if (window.nativebridge._pendingPromises && window.nativebridge._pendingPromises[requestId]) {
        window.nativebridge._pendingPromises[requestId].reject(error);
        delete window.nativebridge._pendingPromises[requestId];
      }
    },`);
    }

    /**
     * Generate helper methods for data persistence across page reloads
     * Creates global variables and getter methods for storing resolved data
     */
    if (webViewMethods.helper) {
      // Create a generic global variable for this topic
      const globalVarName = `native${topic.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join('')}`;
      
      globalHelpers.push(`  window.${globalVarName} = null;`);
      
      // Create the helper getter method
      methods.push(`
    ${webViewMethods.helper}: () => {
      return window.${globalVarName};
    },`);
      
      /**
       * Enhance resolve method to store data globally when helper is present
       * This allows web apps to access resolved data even after page navigation
       */
      if (webViewMethods.resolve) {
        const resolveMethodName = webViewMethods.resolve;
        const resolveIndex = methods.findIndex(m => m.includes(resolveMethodName));
        if (resolveIndex !== -1) {
          methods[resolveIndex] = `
    ${resolveMethodName}: (data, requestId) => {
      window.${globalVarName} = data;
      console.log("${topic} resolved:", data);
      if (window.nativebridge._pendingPromises && window.nativebridge._pendingPromises[requestId]) {
        window.nativebridge._pendingPromises[requestId].resolve(data);
        delete window.nativebridge._pendingPromises[requestId];
      }
    },`;
        }
      }
    }
  });

  /**
   * Return the complete injected JavaScript code
   * This creates a nativebridge object on window with all generated methods
   * and initializes global helper variables
   */
  return `
  // Initialize global variables
${globalHelpers.join('\n')}
  
  window.nativebridge = {${methods.join('')}
  };`;
};

// Keep the old export for backwards compatibility temporarily
export const injectedJavaScript = generateInjectedJavaScript();
