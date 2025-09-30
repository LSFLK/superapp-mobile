/**
 * API Configuration and Endpoint Management
 * 
 * This file centralizes all API endpoint configurations for the admin portal.
 * It provides a flexible system for managing different environments (development, 
 * staging, production) through environment variables while maintaining sensible defaults.
 * 
 * Features:
 * - Centralized endpoint management
 * - Environment variable override support
 * - Consistent URL formatting and validation
 * - Easy endpoint updates without code changes
 */

/**
 * Base API URL for the SuperApp Backend
 * 
 * This is the main backend API hosted on Choreo platform.
 * All micro-app and user management operations go through this service.
 */
export const API_BASE_URL = "https://41200aa1-4106-4e6c-babf-311dce37c04a-prod.e1-us-east-azure.choreoapis.dev/gov-superapp/superappbackendprodbranch/v1.0";

/**
 * Default API Endpoints
 * 
 * Predefined endpoints for different admin portal operations.
 * These can be overridden using environment variables for different deployment environments.
 */
export const ENDPOINTS = {
  // Micro-application management endpoints
  MICROAPPS_LIST: `${API_BASE_URL}/micro-apps`,        // GET: List all available micro-apps
  MICROAPPS_UPLOAD: `${API_BASE_URL}/micro-apps/upload`, // POST: Upload new micro-app package
  
  // User management endpoints  
  USERS: `${API_BASE_URL}/users`                        // GET: User profile and management
};

/**
 * Environment Variable Override System
 * 
 * Gets the appropriate endpoint URL with environment variable override support.
 * This allows different environments (dev, staging, prod) to use different API endpoints
 * without requiring code changes.
 * 
 * Environment Variables Supported:
 * - REACT_APP_MICROAPPS_LIST_URL: Override for micro-app listing endpoint
 * - REACT_APP_MICROAPPS_UPLOAD_URL: Override for micro-app upload endpoint  
 * - REACT_APP_USERS_BASE_URL: Override for user management base URL
 * 
 * @param {string} key - The endpoint key to retrieve (e.g., 'MICROAPPS_LIST')
 * @returns {string} The final endpoint URL with environment overrides applied
 * 
 * Usage Examples:
 * - getEndpoint('MICROAPPS_LIST') // Returns list endpoint
 * - getEndpoint('MICROAPPS_UPLOAD') // Returns upload endpoint
 * - getEndpoint('USERS_BASE') // Returns user base URL
 */
export const getEndpoint = (key) => {
  // Map of endpoint keys to their corresponding environment variables
  const envMap = {
    MICROAPPS_LIST: process.env.REACT_APP_MICROAPPS_LIST_URL,
    MICROAPPS_UPLOAD: process.env.REACT_APP_MICROAPPS_UPLOAD_URL,
    USERS_BASE: process.env.REACT_APP_USERS_BASE_URL
  };
  
  // Return environment variable if set, otherwise fall back to default endpoint
  // Remove trailing slashes to ensure consistent URL formatting
  return (envMap[key] || ENDPOINTS[key] || API_BASE_URL).replace(/\/$/, '');
};
