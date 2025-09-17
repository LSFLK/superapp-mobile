// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

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
      if (topic === 'token') {
        globalHelpers.push(`  window.nativeToken = null;`);
        methods.push(`
    ${webViewMethods.helper}: () => {
      return window.nativeToken;
    },`);
        // Special handling for token resolve
        const resolveIndex = methods.findIndex(m => m.includes('resolveToken'));
        if (resolveIndex !== -1) {
          methods[resolveIndex] = `
    resolveToken: (token) => {
      window.nativeToken = token;
      console.log("Token received from native app:", token);
      window.dispatchEvent(new CustomEvent('nativeTokenReceived', { detail: token }));
    },`;
        }
      } else if (topic === 'emp_id') {
        globalHelpers.push(`  window.nativeEmpId = null;`);
        methods.push(`
    ${webViewMethods.helper}: () => {
      return window.nativeEmpId;
    },`);
        // Special handling for empId resolve
        const resolveIndex = methods.findIndex(m => m.includes('resolveEmpId'));
        if (resolveIndex !== -1) {
          methods[resolveIndex] = `
    resolveEmpId: (empId) => {
      window.nativeEmpId = empId;
      console.log("Employee ID received from native app:", empId);
      window.dispatchEvent(new CustomEvent('nativeEmpIdReceived', { detail: empId }));
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
