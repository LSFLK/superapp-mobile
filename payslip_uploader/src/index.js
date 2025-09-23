import React from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from '@asgardeo/auth-react';
import App from './App';

const authConfig = {
  signInRedirectURL:"https://b3c769e7-a853-48e7-bf41-b857348f02e9.e1-us-east-azure.choreoapps.dev",
  signOutRedirectURL:"https://b3c769e7-a853-48e7-bf41-b857348f02e9.e1-us-east-azure.choreoapps.dev",
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
