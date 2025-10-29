/// <reference types="vite/client" />

/**
 * Window configuration interface
 * Configuration is loaded from public/config.js
 */
interface WindowConfigs {
  ASGARDEO_CLIENT_ID?: string;
  ASGARDEO_BASE_URL?: string;
  SIGN_IN_REDIRECT_URL?: string;
  SIGN_OUT_REDIRECT_URL?: string;
  API_BASE_URL?: string;
}

interface Window {
  configs?: WindowConfigs;
}
