import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthContext } from '@asgardeo/auth-react';
import { extractGroupsFromClaims } from '../constants/auth';

type AuthContextLike = {
  state?: {
    isAuthenticated?: boolean;
    accessToken?: string | null;
    accessTokenPayload?: any;
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

function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
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
    } catch {
      // ignore
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
    } catch {
      // ignore
    }

    // 3) Try basic user info endpoint
    try {
      const basic = await auth?.getBasicUserInfo?.();
      if (basic) {
        const fromUserInfo = extractGroupsFromClaims(basic);
        if (fromUserInfo.length > 0) return fromUserInfo;
      }
    } catch {
      // ignore
    }

    // 4) Try access token payload from state
    try {
      const payload = auth?.state?.accessTokenPayload as any;
      const fromState = extractGroupsFromClaims(payload);
      if (fromState.length > 0) return fromState;
    } catch {
      // ignore
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
      setError('Failed to load user groups');
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
        if (!cancelled) setError('Failed to load user groups');
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
    [isAuthenticated, groups, loading, error, refresh, auth]
  );
}

export default useAuthInfo;
