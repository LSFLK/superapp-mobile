import React from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from '@asgardeo/auth-react';
import App from './App';

const authConfig = {
  signInRedirectURL:"http://localhost:3000",
  signOutRedirectURL:"http://localhost:3000",
  clientID:"0wv2HisKzajiEfWm8ghp_M3c1wEa",
  baseUrl:"https://api.asgardeo.io/t/lsfproject",
  scope: ["openid", "profile"]
};

const el = document.getElementById('root');
createRoot(el).render(
  <React.StrictMode>
    <AuthProvider config={authConfig}>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
