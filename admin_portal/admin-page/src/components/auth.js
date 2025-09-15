// src/auth.js
import { AsgardeoSPAClient } from "@asgardeo/auth-spa";

const authClient = new AsgardeoSPAClient({
  clientID: "s89UtsqQ0_rTfwO783jZw51vHxoa",
  signInRedirectURL: window.location.origin,
  baseURL: "https://api.asgardeo.io/t/jayathunga/oauth2",
  scope: ["openid", "profile", "email"]
});

export default authClient;
