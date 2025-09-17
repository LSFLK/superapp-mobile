import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import { AuthProvider } from '@asgardeo/auth-react';


const root = ReactDOM.createRoot(document.getElementById('root'));
// Derive Asgardeo settings from CRA env (must be prefixed with REACT_APP_).
// Defaults fall back to current origin for local dev.
const signInRedirectURL =
  process.env.REACT_APP_SIGN_IN_REDIRECT_URL || `${window.location.origin}/`;
const signOutRedirectURL =
  process.env.REACT_APP_SIGN_OUT_REDIRECT_URL || `${window.location.origin}/`;
const clientID = process.env.REACT_APP_ASGARDEO_CLIENT_ID || "";
const baseUrl = process.env.REACT_APP_ASGARDEO_BASE_URL || "https://api.asgardeo.io/t/<org_name>";
const scope = (process.env.REACT_APP_ASGARDEO_SCOPES || "openid,profile")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

if (process.env.NODE_ENV !== "production") {
  // Helpful diagnostics in dev
  // eslint-disable-next-line no-console
  console.info("[Asgardeo] Using config:", {
    baseUrl,
    signInRedirectURL,
    signOutRedirectURL,
    scopes: scope,
    clientID_present: Boolean(clientID)
  });
}

root.render(
  <React.StrictMode>

  <AuthProvider
    config={{
      signInRedirectURL,
      signOutRedirectURL,
      clientID,
      baseUrl,
      scope,
      // storage: "sessionStorage",
    }}
  >
      <App />
    </AuthProvider>
    

  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
