/**
 * Asgardeo Authentication Configuration
 * 
 * This file contains the configuration for Asgardeo authentication.
 * All sensitive values are loaded from environment variables.
 */

import type { AuthClientConfig } from '@asgardeo/auth-spa';

/**
 * Get a required environment variable.
 * Throws an error if the variable is not set.
 */
const getRequiredEnv = (key: string): string => {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

/**
 * Asgardeo authentication configuration
 */
export const authConfig: AuthClientConfig<any> = {
  signInRedirectURL: import.meta.env.VITE_SIGN_IN_REDIRECT_URL || 'http://localhost:5173',
  signOutRedirectURL: import.meta.env.VITE_SIGN_OUT_REDIRECT_URL || 'http://localhost:5173',
  clientID: getRequiredEnv('VITE_ASGARDEO_CLIENT_ID'),
  baseUrl: getRequiredEnv('VITE_ASGARDEO_BASE_URL'),
  scope: ['openid', 'profile', 'email', 'groups'],
};

/**
 * API configuration
 */
export const apiConfig = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || '',
};
