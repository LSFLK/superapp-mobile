import { BRIDGE_REGISTRY } from './bridgeRegistry';

/**
 * Auto-generates the injected JavaScript code from the bridge registry
 * This eliminates the need to maintain two separate implementations
 */
export const generateInjectedJavaScript = () => {
  const methods: string[] = [];
  const globalHelpers: string[] = [];

  // Generate methods for each bridge function
  BRIDGE_REGISTRY.forEach(bridgeFunction => {
    const { topic, webViewMethods } = bridgeFunction;

    // Generate request method
    if (webViewMethods.request) {
      methods.push(`
    ${webViewMethods.request}: (data) => {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        topic: '${topic}',
        data: data
      }));
    },`);
    }

    // Generate resolve method
    if (webViewMethods.resolve) {
      methods.push(`
    ${webViewMethods.resolve}: (data) => {
      console.log("${topic} resolved:", data);
      window.dispatchEvent(new CustomEvent('${webViewMethods.resolve}', { detail: data }));
    },`);
    }

    // Generate reject method  
    if (webViewMethods.reject) {
      methods.push(`
    ${webViewMethods.reject}: (error) => {
      console.error("${topic} failed:", error);
      window.dispatchEvent(new CustomEvent('${webViewMethods.reject}', { detail: error }));
    },`);
    }

    // Generate helper methods (global variables and getters)
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
      
      // If there's a resolve method, enhance it to store the value globally
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

  return `
  // Initialize global variables
${globalHelpers.join('\n')}
  
  window.nativebridge = {${methods.join('')}
  };`;
};

// Keep the old export for backwards compatibility temporarily
export const injectedJavaScript = generateInjectedJavaScript();
