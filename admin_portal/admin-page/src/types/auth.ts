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
// Note: Prefer official types from @asgardeo/auth-react for auth context shapes.
