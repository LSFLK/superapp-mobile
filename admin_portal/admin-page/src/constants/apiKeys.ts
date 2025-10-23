// Centralized constants for API endpoint keys used across the app and tests
// Keeping as string literals to match keys used in api.ts ENDPOINTS

export const API_KEYS = {
  MICROAPPS_LIST: "MICROAPPS_LIST",
  MICROAPPS_UPLOAD: "MICROAPPS_UPLOAD",
  MICROAPPS_DELETE: "MICROAPPS_DELETE", // New key for delete endpoint
  USERS_BASE: "USERS_BASE",
  USERS: "USERS",
} as const;

export type ApiKey = (typeof API_KEYS)[keyof typeof API_KEYS];
