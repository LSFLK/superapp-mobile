/**
 * API Configuration and Endpoint Management
 */

// Base API URL for the SuperApp Backend (env override supported)
// export const API_BASE_URL =
//   (process.env.REACT_APP_API_BASE_URL &&
//     process.env.REACT_APP_API_BASE_URL.replace(/\/$/, "")) ||
//   "https://41200aa1-4106-4e6c-babf-311dce37c04a-prod.e1-us-east-azure.choreoapis.dev/gov-superapp/superappbackendprodbranch/v1.0";


// Use proxy path for local development (setupProxy will forward to backend)
export const API_BASE_URL =
  (process.env.REACT_APP_API_BASE_URL &&
    process.env.REACT_APP_API_BASE_URL.replace(/\/$/, "")) ||
  ""; // Use relative path so requests go through setupProxy

// Predefined endpoints for different admin portal operations
export const ENDPOINTS: Record<string, string> = {
  // These paths match the proxy rules in setupProxy.ts
  MICROAPPS_LIST: `/api/microapps`,
  MICROAPPS_UPLOAD: `/api/microapps/upload`,
  MICROAPPS_DELETE: `/api/microapps/`, // Usage: /api/microapps/:appId (DELETE)
  USERS_BASE: `/api/users`,
  USERS: `/api/users`,
};


export type EndpointKey =
  | "MICROAPPS_LIST"
  | "MICROAPPS_UPLOAD"
  | "MICROAPPS_DELETE"
  | "USERS_BASE"
  | "USERS";

/**
 * Gets the appropriate endpoint URL with environment variable override support.
 * Falls back to defaults and trims trailing slash.
 */
export const getEndpoint = (key: EndpointKey | string): string => {
  const envMap: Record<string, string | undefined> = {
    MICROAPPS_LIST: process.env.REACT_APP_MICROAPPS_LIST_URL,
    MICROAPPS_UPLOAD: process.env.REACT_APP_MICROAPPS_UPLOAD_URL,
    MICROAPPS_DELETE: process.env.REACT_APP_MICROAPPS_DELETE_URL,
    USERS_BASE: process.env.REACT_APP_USERS_BASE_URL,
    USERS: process.env.REACT_APP_USERS_URL,
  };

  const fromEnv = envMap[key];
  const fromDefaults = ENDPOINTS[key as keyof typeof ENDPOINTS];
  return (fromEnv || fromDefaults || API_BASE_URL).replace(/\/$/, "");
};
