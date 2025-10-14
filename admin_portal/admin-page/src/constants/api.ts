/**
 * API Configuration and Endpoint Management (TypeScript)
 */

// Base API URL for the SuperApp Backend
export const API_BASE_URL =
  "https://41200aa1-4106-4e6c-babf-311dce37c04a-prod.e1-us-east-azure.choreoapis.dev/gov-superapp/superappbackendprodbranch/v1.0";

// Predefined endpoints for different admin portal operations
export const ENDPOINTS: Record<string, string> = {
  MICROAPPS_LIST: `${API_BASE_URL}/micro-apps`,
  MICROAPPS_UPLOAD: `${API_BASE_URL}/micro-apps/upload`,
  USERS: `${API_BASE_URL}/users`,
};

export type EndpointKey = "MICROAPPS_LIST" | "MICROAPPS_UPLOAD" | "USERS_BASE" | "USERS";

/**
 * Gets the appropriate endpoint URL with environment variable override support.
 * Falls back to defaults and trims trailing slash.
 */
export const getEndpoint = (key: EndpointKey | string): string => {
  const envMap: Record<string, string | undefined> = {
    MICROAPPS_LIST: process.env.REACT_APP_MICROAPPS_LIST_URL,
    MICROAPPS_UPLOAD: process.env.REACT_APP_MICROAPPS_UPLOAD_URL,
    USERS_BASE: process.env.REACT_APP_USERS_BASE_URL,
  };

  const fromEnv = envMap[key];
  const fromDefaults = ENDPOINTS[key as keyof typeof ENDPOINTS];
  return (fromEnv || fromDefaults || API_BASE_URL).replace(/\/$/, "");
};
