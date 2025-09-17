import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import { AuthProvider } from '@asgardeo/auth-react';


const root = ReactDOM.createRoot(document.getElementById('root'));

// Build Asgardeo config from env with safe defaults.
// CRA only exposes env vars prefixed with REACT_APP_.
const ensureTrailingSlash = (url) => (url.endsWith('/') ? url : url + '/');
const defaultBasePath = process.env.REACT_APP_BASE_PATH || '/';
const defaultUrl = ensureTrailingSlash(
  `${window.location.origin}${defaultBasePath.startsWith('/') ? defaultBasePath : `/${defaultBasePath}`}`
);

const asgardeoConfig = {
  signInRedirectURL:
    process.env.REACT_APP_SIGN_IN_REDIRECT_URL
      ? ensureTrailingSlash(process.env.REACT_APP_SIGN_IN_REDIRECT_URL)
      : defaultUrl,
  signOutRedirectURL:
    process.env.REACT_APP_SIGN_OUT_REDIRECT_URL
      ? ensureTrailingSlash(process.env.REACT_APP_SIGN_OUT_REDIRECT_URL)
      : defaultUrl,
  clientID: process.env.REACT_APP_ASGARDEO_CLIENT_ID || '',
  baseUrl: process.env.REACT_APP_ASGARDEO_BASE_URL || '',
  scope: (process.env.REACT_APP_ASGARDEO_SCOPE || 'openid profile').split(/[,\s]+/).filter(Boolean),
};

root.render(
  <React.StrictMode>
    <AuthProvider config={asgardeoConfig}>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
