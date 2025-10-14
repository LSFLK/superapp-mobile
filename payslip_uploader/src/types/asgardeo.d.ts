declare module '@asgardeo/auth-react' {
  import type React from 'react';

  export interface BasicUserInfo {
    [key: string]: unknown;
  }

  export interface AuthContextShape {
    state?: {
      isAuthenticated?: boolean;
      accessTokenPayload?: Record<string, any>;
      username?: string;
      displayName?: string;
      given_name?: string;
    };
    isAuthenticated?: boolean;
    signIn?: () => Promise<void> | void;
    signOut?: () => Promise<void> | void;
    getAccessToken?: () => Promise<string>;
    getIDToken?: () => Promise<string>;
    getDecodedIDToken?: () => unknown;
    getBasicUserInfo?: () => Promise<BasicUserInfo>;
  }

  export function useAuthContext(): AuthContextShape;
  export const AuthProvider: React.ComponentType<{ config: Record<string, any>; children?: React.ReactNode }>;
}
