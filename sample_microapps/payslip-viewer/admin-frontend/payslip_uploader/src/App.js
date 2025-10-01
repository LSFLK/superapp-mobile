/**
 * Main App Component - Root Application Container
 * 
 * This is the primary entry point and orchestrator for the Payslip Uploader application.
 * It serves as the main controller that manages the application's authentication state
 * and renders the appropriate user interface based on whether the user is signed in.
 * 
 * ARCHITECTURE OVERVIEW:
 * =====================
 * The component follows a simple but effective pattern:
 * 1. Check authentication state using Asgardeo Auth Context
 * 2. Render sign-in interface for unauthenticated users
 * 3. Render main application interface for authenticated users
 * 4. Handle user session management (sign-out functionality)
 * 
 * AUTHENTICATION FLOW:
 * ===================
 * - Uses Asgardeo (WSO2's identity provider) for OAuth2/OIDC authentication
 * - Manages authentication state through React context
 * - Provides graceful handling of authentication loading states
 * - Extracts user display information from authentication tokens
 * 
 * UI RESPONSIBILITIES:
 * ===================
 * - Renders application header with user welcome message
 * - Provides sign-out functionality in the header
 * - Contains the main PayslipUpload component for authenticated users
 * - Displays file format requirements and instructions
 * - Maintains consistent styling using centralized CSS classes
 * 
 * SECURITY CONSIDERATIONS:
 * =======================
 * - Only renders sensitive components when user is authenticated
 * - Properly handles authentication tokens through Asgardeo context
 * - Provides secure sign-out that clears session data
 * 
 * @component
 * @example
 * // The App component is typically rendered at the root level:
 * <AuthProvider config={authConfig}>
 *   <App />
 * </AuthProvider>
 */

import React, { useEffect, useState } from 'react';
import { useAuthContext } from '@asgardeo/auth-react';
import PayslipUpload from './PayslipUpload';
import RoleBasedAccessControl from './components/RoleBasedAccessControl';
import { CSS_CLASSES } from './constants';
import './styles.css';

/**
 * Main App Component Function
 * 
 * The core functional component that orchestrates the entire application's rendering logic.
 * This component is responsible for:
 * 
 * AUTHENTICATION MANAGEMENT:
 * - Interfacing with Asgardeo authentication context
 * - Determining user authentication status
 * - Extracting user information from authentication tokens
 * - Providing sign-out functionality
 * 
 * CONDITIONAL RENDERING:
 * - Shows sign-in page for unauthenticated users
 * - Shows main application interface for authenticated users
 * - Handles loading states during authentication checks
 * 
 * USER EXPERIENCE:
 * - Displays personalized welcome messages
 * - Provides clear call-to-action for sign-in
 * - Maintains consistent UI styling and layout
 * 
 * @returns {JSX.Element} The complete rendered application interface
 */
export default function App() {
  // ============================================================================
  // AUTHENTICATION STATE MANAGEMENT
  // ============================================================================
  
  /**
   * Access to Asgardeo authentication context
   * 
   * This hook provides access to:
   * - Authentication state (isAuthenticated, isLoading)
   * - User information (username, displayName, email)
   * - Authentication methods (signIn, signOut, getAccessToken)
   * - Token management (getIDToken, getAccessToken)
   */
  const auth = useAuthContext();
  
  /**
   * Extract authentication status from context
   * 
   * This boolean determines whether the user has successfully completed
   * the OAuth2/OIDC authentication flow and has valid tokens.
   * 
   * @type {boolean}
   */
  const isAuthenticated = auth?.state?.isAuthenticated;
  
  /**
   * Extract username from authentication context
   * 
   * The username is typically the user's email address or unique identifier
   * provided by the identity provider (Asgardeo).
   * 
   * @type {string}
   */
  const username = auth?.state?.username || '';
  
  /**
   * Determine display name for user interface
   * 
   * Priority order for display name:
   * 1. displayName from auth context (if provided by identity provider)
   * 2. Username portion before @ symbol (extracted from email)
   * 3. Generic "User" fallback
   * 
   * This ensures users always see a friendly name in the interface.
   * 
   * @type {string}
   */
  const displayName = auth?.state?.displayName || username.split('@')[0] || 'User';

  // ============================================================================
  // UNAUTHENTICATED USER INTERFACE
  // ============================================================================
  
  /**
   * Render sign-in page for unauthenticated users
   * 
   * This interface is shown when users first visit the application or when
   * their session has expired. It provides:
   * 
   * - Clear application branding and purpose
   * - Simple sign-in call-to-action
   * - Information about authentication requirements
   * - Professional, welcoming design
   * 
   * The sign-in process is handled entirely by Asgardeo, ensuring secure
   * OAuth2/OIDC authentication without exposing sensitive logic in the frontend.
   */
  if (!isAuthenticated) {
    return (
      <div className="app-shell">
        <div className={CSS_CLASSES.CARD}>
          <div className="auth-container">
            {/* Application Title and Branding */}
            <h1 className="title">Payslip Upload Portal</h1>
            <p className="subtitle">Please sign in to access the payslip upload functionality.</p>
            
            {/* Primary Authentication Action */}
            <div className="auth-actions">
              <button 
                className={CSS_CLASSES.BUTTON_PRIMARY} 
                onClick={() => auth?.signIn()}
                aria-label="Sign in using Asgardeo authentication"
              >
                Sign In with Asgardeo
              </button>
            </div>
            
            {/* Additional Context for Users */}
            <div className="auth-note">
              <p>You need to be authenticated to upload and view payslip data.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // AUTHENTICATED USER INTERFACE
  // ============================================================================
  
  /**
   * Render main application interface for authenticated users
   * 
   * This is the primary application interface that provides:
   * 
   * HEADER SECTION:
   * - Application title and branding
   * - Personalized welcome message with user's display name
   * - Sign-out functionality for session management
   * - Clear instructions about supported file formats
   * 
   * MAIN CONTENT:
   * - PayslipUpload component for file upload functionality
   * - Real-time file processing and upload status
   * - Data validation and error handling
   * - Uploaded data display in tabular format
   * 
   * FOOTER INFORMATION:
   * - Required CSV/Excel column format specification
   * - Clear examples of expected data structure
   * - User guidance for successful uploads
   * 
   * The interface maintains accessibility standards and responsive design
   * principles for optimal user experience across devices.
   */
  return (
    // <RoleBasedAccessControl requiredGroup="Finance_dept">
      <div className="app-shell">
        <div className={CSS_CLASSES.CARD}>
          {/* ===== APPLICATION HEADER ===== */}
          <div className={CSS_CLASSES.HEADER_SECTION}>
            <div className={CSS_CLASSES.HEADER_CONTENT}>
              {/* Main Application Title */}
              <h1 className="title">Payslip Upload</h1>
              
              {/* User Information and Session Management */}
              <div className={CSS_CLASSES.USER_INFO}>
                <span className="welcome-text">Welcome, {displayName}</span>
                <button 
                  className={`${CSS_CLASSES.BUTTON_SECONDARY} ${CSS_CLASSES.BUTTON_SMALL}`} 
                  onClick={() => auth?.signOut()}
                  aria-label="Sign out and end current session"
                  title="Sign out from the application"
                >
                  Sign Out
                </button>
              </div>
            </div>
            
            {/* File Format Instructions */}
            <p className="subtitle">Upload an <strong>Excel</strong> or <strong>CSV</strong> file.</p>
          </div>

          {/* ===== MAIN UPLOAD FUNCTIONALITY ===== */}
          {/* 
            PayslipUpload component handles:
            - Drag-and-drop file upload interface
            - File format validation and conversion
            - Backend API communication
            - Upload progress and status feedback
            - Data display table with uploaded records
          */}
          <PayslipUpload />

          {/* ===== DIVIDER ===== */}
          <hr className="hr" />
          
          {/* ===== FOOTER INFORMATION ===== */}
          {/* 
            Critical information about required data format
            Helps users structure their files correctly for successful uploads
          */}
          <div className="footer-note">
            Ensure the column headers follow the required format:{' '}
            <code className="inline">
              user id, designation, name, department, pay_period, basic_salary, allowances, deductions, net_salary
            </code>
          </div>
        </div>
      </div>
    // </RoleBasedAccessControl>
  );
}
