/**
 * Asgardeo Authentication Configuration
 * 
 * Configuration is loaded from window.configs (set in public/config.js)
 */

import type { AuthClientConfig } from '@asgardeo/auth-spa';

/**
 * Get configuration value from window.configs
 */
const getConfig = (key: keyof WindowConfigs, defaultValue?: string): string => {
  const value = window.configs?.[key];
  
  if (value) {
    return value;
  }
  
  if (defaultValue !== undefined) {
    return defaultValue;
  }
  
  throw new Error(`Missing required configuration: ${key}. Please check public/config.js`);
};

/**
 * Asgardeo authentication configuration
 */
export const authConfig: AuthClientConfig<any> = {
  signInRedirectURL: getConfig('SIGN_IN_REDIRECT_URL', 'http://localhost:5173'),
  signOutRedirectURL: getConfig('SIGN_OUT_REDIRECT_URL', 'http://localhost:5173'),
  clientID: getConfig('ASGARDEO_CLIENT_ID'),
  baseUrl: getConfig('ASGARDEO_BASE_URL'),
  scope: ['openid', 'profile', 'email', 'groups'],
};

/**
 * API configuration
 */
export const apiConfig = {
  baseUrl: getConfig('API_BASE_URL', ''),
};
