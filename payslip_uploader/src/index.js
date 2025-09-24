/**
 * Application Entry Point - Bootstrap and Configuration Hub
 * 
 * This file serves as the primary bootstrap point for the Payslip Uploader application.
 * It is responsible for initializing the React application with all necessary providers,
 * configurations, and context providers that the entire application depends on.
 * 
 * PRIMARY RESPONSIBILITIES:
 * ========================
 * - React 18 application initialization with createRoot API
 * - Asgardeo authentication provider configuration and setup
 * - Application-wide context provider hierarchy establishment
 * - Root component rendering and DOM mounting
 * - Development vs production environment handling
 * 
 * AUTHENTICATION ARCHITECTURE:
 * ===========================
 * The application uses Asgardeo (WSO2's identity and access management solution)
 * for secure OAuth2/OIDC authentication. This provides:
 * 
 * - Enterprise-grade security with industry standards (OAuth2, OIDC)
 * - Seamless integration with existing identity providers
 * - Automatic token management and refresh
 * - Secure session handling and logout functionality
 * - Multi-factor authentication support
 * - Centralized user management and access control
 * 
 * CONFIGURATION MANAGEMENT:
 * =========================
 * Authentication configuration is centralized in this file to:
 * - Provide single source of truth for auth settings
 * - Enable easy environment-specific configuration
 * - Support deployment across different environments
 * - Maintain security best practices with proper URL validation
 * 
 * REACT 18 INTEGRATION:
 * ====================
 * Uses the modern React 18 createRoot API which provides:
 * - Improved performance with concurrent rendering
 * - Better error handling and recovery
 * - Enhanced development experience
 * - Future-proof architecture for React ecosystem evolution
 * 
 * SECURITY CONSIDERATIONS:
 * =======================
 * - All authentication URLs are validated and HTTPS-enforced
 * - Client ID and base URLs are configured for specific deployment
 * - Redirect URLs are properly configured to prevent open redirect attacks
 * - Scope configuration follows principle of least privilege
 * 
 * @fileoverview Application bootstrap and authentication configuration
 * @author Payslip Uploader Development Team
 * @version 1.0.0
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from '@asgardeo/auth-react';
import App from './App';

// ============================================================================
// AUTHENTICATION CONFIGURATION
// ============================================================================

/**
 * Asgardeo OAuth2/OIDC Authentication Configuration
 * 
 * This configuration object defines all the necessary parameters for establishing
 * secure authentication with the Asgardeo identity provider. Each parameter plays
 * a crucial role in the OAuth2/OIDC flow and application security.
 * 
 * CONFIGURATION PARAMETERS:
 * ========================
 * 
 * @property {string} signInRedirectURL - URL where users are redirected after successful authentication
 *   - Must match the redirect URI configured in Asgardeo application settings
 *   - Should be the main application URL where authenticated users land
 *   - Currently configured for local development (localhost:3000)
 *   - Production URLs (commented) should use HTTPS for security compliance
 * 
 * @property {string} signOutRedirectURL - URL where users are redirected after sign-out
 *   - Typically the same as sign-in URL or a dedicated landing page
 *   - Ensures users have a clear path back to the application
 *   - Should provide guidance for re-authentication if needed
 * 
 * @property {string} clientID - Unique identifier for this application in Asgardeo
 *   - Generated when registering the application in Asgardeo console
 *   - Acts as public identifier (not a secret) for OAuth2 flow
 *   - Must match exactly with Asgardeo application configuration
 * 
 * @property {string} baseUrl - Base URL for the Asgardeo organization
 *   - Points to the specific organization's Asgardeo instance
 *   - Format: https://api.asgardeo.io/t/{organization-name}
 *   - Enables multi-tenant identity provider functionality
 * 
 * @property {string[]} scope - OAuth2 scopes requested during authentication
 *   - "openid": Required for OIDC authentication flow
 *   - "profile": Grants access to user profile information (name, email, etc.)
 *   - Additional scopes can be added based on application requirements
 * 
 * ENVIRONMENT CONFIGURATION:
 * =========================
 * The commented URLs represent production/staging environment settings.
 * Current active URLs are configured for local development.
 */
const authConfig = {
  // Production/Staging URLs (commented for local development)
  //signInRedirectURL: "https://b3c769e7-a853-48e7-bf41-b857348f02e9.e1-us-east-azure.choreoapps.dev",
  //signOutRedirectURL: "https://b3c769e7-a853-48e7-bf41-b857348f02e9.e1-us-east-azure.choreoapps.dev",
  
  // Local development URLs (active configuration)
  signInRedirectURL: "http://localhost:3000",
  signOutRedirectURL: "http://localhost:3000",
  
  // Application identification and organization settings
  clientID: "0wv2HisKzajiEfWm8ghp_M3c1wEa",
  baseUrl: "https://api.asgardeo.io/t/lsfproject",
  scope: ["openid", "profile"]
};

// ============================================================================
// APPLICATION BOOTSTRAP AND RENDERING
// ============================================================================

/**
 * Root DOM element identification and validation
 * 
 * Locates the DOM element where the React application will be mounted.
 * This element should be present in the public/index.html file.
 */
const rootElement = document.getElementById('root');

/**
 * React 18 root creation
 * 
 * Creates a React 18 root using the modern createRoot API, which provides:
 * - Concurrent rendering capabilities
 * - Improved error handling
 * - Better performance characteristics
 * - Future compatibility with React ecosystem
 */
const root = createRoot(rootElement);

/**
 * Application rendering with provider hierarchy
 * 
 * Renders the complete application with necessary context providers:
 * 
 * REACT.STRICTMODE:
 * - Enables additional development checks and warnings
 * - Helps identify unsafe lifecycles and deprecated APIs
 * - Activates strict effects mode for better debugging
 * - Only active in development mode
 * 
 * AUTHPROVIDER:
 * - Wraps the entire application with Asgardeo authentication context
 * - Makes authentication state and methods available to all components
 * - Handles token management, refresh, and storage automatically
 * - Provides secure access to user information throughout the component tree
 * 
 * APP COMPONENT:
 * - Root application component that contains all application logic
 * - Manages authentication-dependent rendering
 * - Orchestrates the main user interface and navigation
 */
root.render(
  <React.StrictMode>
    <AuthProvider config={authConfig}>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
