import { CLIENT_ID, REDIRECT_URI, TOKEN_URL } from "@/constants/Constants";

export const AUTH_CONFIG = {
  issuer: TOKEN_URL,
  clientId: CLIENT_ID,
  redirectUrl: REDIRECT_URI,
  scopes: ["openid", "profile"],
  postLogoutRedirectUrl: REDIRECT_URI,
  iosPrefersEphemeralSession: true,
};
