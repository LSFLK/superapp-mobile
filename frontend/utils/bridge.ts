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
     * Generate request method - allows web app to send requests to native
     * This creates window.nativebridge.someMethod(data) that posts messages to React Native
     */
    if (webViewMethods.request) {
      methods.push(`
    ${webViewMethods.request}: (data) => {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        topic: '${topic}',
        data: data
      }));
    },`);
    }

    /**
     * Generate resolve method - allows native to send success responses to web
     * Dispatches custom events that web apps can listen to
     */
    if (webViewMethods.resolve) {
      methods.push(`
    ${webViewMethods.resolve}: (data) => {
      console.log("${topic} resolved:", data);
      window.dispatchEvent(new CustomEvent('${webViewMethods.resolve}', { detail: data }));
    },`);
    }

    /**
     * Generate reject method - allows native to send error responses to web
     * Dispatches custom events for error handling
     */
    if (webViewMethods.reject) {
      methods.push(`
    ${webViewMethods.reject}: (error) => {
      console.error("${topic} failed:", error);
      window.dispatchEvent(new CustomEvent('${webViewMethods.reject}', { detail: error }));
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
          const eventName = `native${topic.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join('')}Received`;
          
          methods[resolveIndex] = `
    ${resolveMethodName}: (data) => {
      window.${globalVarName} = data;
      console.log("${topic} resolved:", data);
      window.dispatchEvent(new CustomEvent('${resolveMethodName}', { detail: data }));
      window.dispatchEvent(new CustomEvent('${eventName}', { detail: data }));
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
