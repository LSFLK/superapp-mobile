import { getAuthContext } from "./microAppsServiceAuth";

// Endpoint base (list all micro-apps)
const DEFAULT_MICROAPPS_LIST_URL = "https://41200aa1-4106-4e6c-babf-311dce37c04a-prod.e1-us-east-azure.choreoapis.dev/gov-superapp/superappbackendprodbranch/v1.0/micro-apps";
const ENV_MICROAPPS_LIST_URL = process.env.REACT_APP_MICROAPPS_LIST_URL;
const RESOLVED_MICROAPPS_LIST_URL = (ENV_MICROAPPS_LIST_URL || DEFAULT_MICROAPPS_LIST_URL).replace(/\/$/, '');

export async function fetchMicroApps() {
  const auth = getAuthContext?.();
  const headers = {};
  try {
    if (auth?.state?.isAuthenticated) {
      const idToken = await auth.getIDToken().catch(() => undefined);
      if (idToken) headers["x-jwt-assertion"] = idToken;
      const accessToken = await auth.getAccessToken().catch(() => undefined);
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
    }
  } catch (e) {
    console.warn("Auth acquisition failed for micro-app list", e);
  }
  if (process.env.REACT_APP_MICROAPPS_SUPPRESS_ASSERTION === 'true' && headers['x-jwt-assertion']) {
    delete headers['x-jwt-assertion'];
  }
  const res = await fetch(RESOLVED_MICROAPPS_LIST_URL, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error || data?.message || `Failed to fetch micro apps (${res.status})`;
    throw new Error(msg);
  }
  // Expect array of micro apps
  if (!Array.isArray(data)) return [];
  return data;
}
