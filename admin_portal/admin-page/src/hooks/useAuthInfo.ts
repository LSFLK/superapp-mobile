import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthContext } from "@asgardeo/auth-react";
import { extractGroupsFromClaims } from "../utils/auth";

// Minimal JWT payload shape we care about, with common registered claims
// and known group/role claim variants used in this app.
export interface JWTPayload {
  // Registered claims
  iss?: string;
  sub?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
  // Common OIDC profile claims
  scope?: string | string[];
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  // Group/role claims we look for when extracting access control
  groups?: string[] | string;
  roles?: string[] | string;
  role?: string[] | string;
  "http://wso2.org/claims/role"?: string[] | string;
  wso2_role?: string[] | string;
  // Allow any additional provider-specific claims
  [claim: string]: unknown;
}

type AuthContextLike = {
  state?: {
    isAuthenticated?: boolean;
    accessToken?: string | null;
  accessTokenPayload?: JWTPayload | Record<string, unknown> | null;
  };
  getAccessToken?: () => Promise<string | null | undefined>;
  getIDToken?: () => Promise<string | null | undefined>;
  getDecodedIDToken?: () => any;
  getBasicUserInfo?: () => Promise<any>;
};

export type AuthInfo = {
  isAuthenticated: boolean;
  groups: string[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  // Expose the raw auth context only if consumers need signOut, etc.
  auth: AuthContextLike;
};

// Utility function to decode base64url strings (used in JWTs)
function base64UrlDecode(input: string): string {
  // Replace non-url compatible chars with base64 standard chars
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  // Pad with '=' to make length a multiple of 4
  const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "=");
  // Decode base64 string
  return atob(padded);
}
function decodeJwtPayload(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // Use the utility function to decode the payload
    const json = base64UrlDecode(parts[1]);
    const payload: JWTPayload = JSON.parse(json);
    return payload;
  } catch (err) {
    // Keep token details out of logs; just note the failure.
    console.error("useAuthInfo.decodeJwtPayload: Failed to decode JWT payload", err);
    return null;
  }
}

export function useAuthInfo(): AuthInfo {
  const auth = useAuthContext() as unknown as AuthContextLike;
  const isAuthenticated = !!auth?.state?.isAuthenticated;

  const [groups, setGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const extractUserGroups = useCallback(async (): Promise<string[]> => {
    // 1) Try access token (decode JWT)
    try {
      const accessToken = await auth?.getAccessToken?.();
      if (accessToken) {
        const payload = decodeJwtPayload(accessToken);
        if (payload) {
          const fromAccess = extractGroupsFromClaims(payload);
          if (fromAccess.length > 0) return fromAccess;
        }
      }
    } catch (err) {
      console.error("useAuthInfo.extractUserGroups: Access token processing failed", err);
    }

    // 2) Try ID token (decoded claims)
    try {
      const idToken = await auth?.getIDToken?.();
      if (idToken) {
        const decoded = auth?.getDecodedIDToken?.();
        if (decoded) {
          const fromId = extractGroupsFromClaims(decoded);
          if (fromId.length > 0) return fromId;
        }
      }
    } catch (err) {
      console.error("useAuthInfo.extractUserGroups: ID token processing failed", err);
    }

    // 3) Try basic user info endpoint
    try {
      const basic = await auth?.getBasicUserInfo?.();
      if (basic) {
        const fromUserInfo = extractGroupsFromClaims(basic);
        if (fromUserInfo.length > 0) return fromUserInfo;
      }
    } catch (err) {
      console.error("useAuthInfo.extractUserGroups: Basic user info processing failed", err);
    }

    // 4) Try access token payload from state
    try {
  const payload = auth?.state?.accessTokenPayload as unknown;
      const fromState = extractGroupsFromClaims(payload);
      if (fromState.length > 0) return fromState;
    } catch (err) {
      console.error("useAuthInfo.extractUserGroups: Access token payload from state processing failed", err);
    }

    // Nothing found
    return [];
  }, [auth]);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setGroups([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const g = await extractUserGroups();
      setGroups(g);
    } catch (e) {
  console.error("useAuthInfo.refresh: Failed to load user groups", e);
      setError("Failed to load user groups");
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [extractUserGroups, isAuthenticated]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isAuthenticated) {
        setGroups([]);
        setLoading(false);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const g = await extractUserGroups();
        if (!cancelled) setGroups(g);
      } catch (e) {
  console.error("useAuthInfo.effect: Failed to load user groups", e);
        if (!cancelled) setError("Failed to load user groups");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, extractUserGroups]);

  return useMemo(
    () => ({ isAuthenticated, groups, loading, error, refresh, auth }),
    [isAuthenticated, groups, loading, error, refresh, auth],
  );
}

export default useAuthInfo;
