/**
 * Asgardeo Authentication Configuration
 * 
 * Supports configuration from:
 * 1. window.configs (for Choreo deployment)
 * 2. Environment variables (for local development)
 */

import type { AuthClientConfig } from '@asgardeo/auth-spa';

/**
 * Get configuration value with priority:
 * 1. window.configs (runtime config)
 * 2. Environment variable (build-time config)
 * 3. Default value
 */
const getConfig = (windowKey: keyof WindowConfigs, envKey: string, defaultValue?: string): string => {
  // Try window.configs first (Choreo deployment)
  if (window.configs && window.configs[windowKey]) {
    return window.configs[windowKey]!;
  }
  
  // Fall back to environment variable
  const envValue = import.meta.env[envKey];
  if (envValue) {
    return envValue;
  }
  
  // Use default or throw error
  if (defaultValue !== undefined) {
    return defaultValue;
  }
  
  throw new Error(`Missing required configuration: ${windowKey} or ${envKey}`);
};

/**
 * Asgardeo authentication configuration
 */
export const authConfig: AuthClientConfig<any> = {
  signInRedirectURL: getConfig('SIGN_IN_REDIRECT_URL', 'VITE_SIGN_IN_REDIRECT_URL', 'http://localhost:5173'),
  signOutRedirectURL: getConfig('SIGN_OUT_REDIRECT_URL', 'VITE_SIGN_OUT_REDIRECT_URL', 'http://localhost:5173'),
  clientID: getConfig('ASGARDEO_CLIENT_ID', 'VITE_ASGARDEO_CLIENT_ID'),
  baseUrl: getConfig('ASGARDEO_BASE_URL', 'VITE_ASGARDEO_BASE_URL'),
  scope: ['openid', 'profile', 'email', 'groups'],
};

/**
 * API configuration
 */
export const apiConfig = {
  baseUrl: getConfig('API_BASE_URL', 'VITE_API_BASE_URL', ''),
};
