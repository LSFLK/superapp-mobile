// Shared auth-related minimal types used across components and hooks

export interface JWTPayload {
  iss?: string;
  sub?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
  scope?: string | string[];
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  groups?: string[] | string;
  roles?: string[] | string;
  role?: string[] | string;
  "http://wso2.org/claims/role"?: string[] | string;
  wso2_role?: string[] | string;
  [claim: string]: unknown;
}

export type AuthContextLike = {
  state?: {
    isAuthenticated?: boolean;
    accessToken?: string | null;
    accessTokenPayload?: JWTPayload | Record<string, unknown> | null;
  };
  getAccessToken?: () => Promise<string | null | undefined>;
  getIDToken?: () => Promise<string | null | undefined>;
  getDecodedIDToken?: () => unknown;
  getBasicUserInfo?: () => Promise<unknown>;
  // Sign-out implementations vary across SDKs; allow a flexible signature.
  signOut?: (...args: unknown[]) => unknown;
};
