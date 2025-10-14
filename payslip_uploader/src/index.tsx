/**
 * Application Entry Point - Bootstrap and Configuration Hub (TypeScript)
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline } from '@mui/material';
import { AuthProvider } from '@asgardeo/auth-react';
import App from './App';

// Asgardeo OAuth2/OIDC Authentication Configuration
const authConfig = {
  // Production/Staging URLs
  //signInRedirectURL: 'https://b3c769e7-a853-48e7-bf41-b857348f02e9.e1-us-east-azure.choreoapps.dev',
  //signOutRedirectURL: 'https://b3c769e7-a853-48e7-bf41-b857348f02e9.e1-us-east-azure.choreoapps.dev',

  // Local development URLs (commented)
  signInRedirectURL: 'http://localhost:3000',
  signOutRedirectURL: 'http://localhost:3000',

  clientID: '0wv2HisKzajiEfWm8ghp_M3c1wEa',
  baseUrl: 'https://api.asgardeo.io/t/lsfproject',
  scope: ['openid', 'profile', 'groups'],
} as const;

// Root DOM element
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element with id "root" not found');
}

const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <AuthProvider config={authConfig as any}>
  <CssBaseline />
  <App />
    </AuthProvider>
  </StrictMode>,
);
