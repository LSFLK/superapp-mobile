/**
 * Main entry point for the Admin Portal React application
 * 
 * This file bootstraps the React application with:
 * - Asgardeo authentication provider for SSO integration
 * - Ant Design CSS framework
 * - Performance monitoring via reportWebVitals
 * 
 * Authentication Flow:
 * - Uses Asgardeo OAuth2/OIDC for secure authentication
 * - Configured for both local development and production deployment
 * - Supports OpenID Connect with profile scopes
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import 'antd/dist/reset.css'; // Ant Design CSS reset for consistent styling
import './index.css'; // Custom global styles and CSS variables
import App from './App'; // Main application component
import reportWebVitals from './reportWebVitals'; // Performance monitoring utility

// Asgardeo authentication provider for OAuth2/OIDC integration
import { AuthProvider } from '@asgardeo/auth-react';

// Create React 18 root for concurrent features
const root = ReactDOM.createRoot(document.getElementById('root'));

/**
 * Asgardeo Authentication Configuration
 * 
 * Configuration for OAuth2/OIDC authentication with Asgardeo identity provider.
 * The setup supports both local development and production environments.
 * 
 * Key Configuration:
 * - signInRedirectURL: Where users are redirected after successful login
 * - signOutRedirectURL: Where users are redirected after logout
 * - clientID: OAuth2 client identifier registered in Asgardeo
 * - baseUrl: Asgardeo tenant base URL for the organization
 * - scope: OpenID Connect scopes requested (openid for authentication, profile for user info)
 */


root.render(
  <React.StrictMode>
    {/* 
      AuthProvider wraps the entire app to provide authentication context
      All child components can access authentication state and methods
    */}
    <AuthProvider
      config={{
        // Production URLs (currently active for deployment)
        //signInRedirectURL: "https://a96477cc-362b-4509-95ad-fcdb6507c34a.e1-us-east-azure.choreoapps.dev",
        //signOutRedirectURL: "https://a96477cc-362b-4509-95ad-fcdb6507c34a.e1-us-east-azure.choreoapps.dev",
        
        // Local development URLs (commented out - uncomment for local dev)
        signInRedirectURL: "http://localhost:3000",
        signOutRedirectURL: "http://localhost:3000",
        
        // OAuth2 client credentials (registered in Asgardeo console)
        clientID: "aVro3ATf5ZSglZHItEDj0Kd7M4wa",
        baseUrl: "https://api.asgardeo.io/t/lsfproject", // Asgardeo tenant URL
        
        // OpenID Connect scopes - determines what user information is available
        scope: ["openid", "profile", "groups"] // openid = authentication, profile = user details, groups = group membership
      }}
    >
      <App />
    </AuthProvider>
  </React.StrictMode>
);

/**
 * Performance Monitoring Setup
 * 
 * reportWebVitals can be used to measure and track performance metrics
 * for the admin portal. This helps monitor application performance in
 * production and identify potential optimization opportunities.
 * 
 * To enable performance monitoring, pass a function to log results:
 * reportWebVitals(console.log) or send to analytics endpoint
 * 
 * Learn more: https://bit.ly/CRA-vitals
 */
reportWebVitals();
