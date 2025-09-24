/**
 * Role-Based Access Control Component for Payslip Uploader
 * 
 * This component enforces group-based authorization for the payslip uploader application.
 * It works in conjunction with Asgardeo's adaptive authentication to ensure that only
 * users who belong to the required Finance department group can access the application.
 * 
 * SECURITY ARCHITECTURE:
 * =====================
 * - Server-side: Asgardeo adaptive authentication script checks group membership
 * - Client-side: This component provides additional validation and user experience
 * - Defense in depth: Multiple layers of security validation
 * 
 * AUTHENTICATION FLOW:
 * ===================
 * 1. User authenticates via Asgardeo OAuth2/OIDC
 * 2. Server-side adaptive auth script validates group membership
 * 3. This component extracts and validates groups from JWT tokens
 * 4. Shows appropriate UI based on authorization status
 * 
 * SUPPORTED TOKEN SOURCES:
 * =======================
 * - ID Token: Standard OpenID Connect claims
 * - Access Token: API authorization claims
 * - Basic User Info: Fallback user information
 * - Auth State: Direct authentication state access
 * 
 * @component
 * @example
 * <RoleBasedAccessControl requiredGroup="Finance_dept">
 *   <PayslipUploadInterface />
 * </RoleBasedAccessControl>
 */

import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@asgardeo/auth-react';

/**
 * RoleBasedAccessControl Component
 * 
 * Provides group-based access control for the payslip uploader application.
 * Only allows access to users who are members of the Finance_dept group.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render when authorized
 * @param {string} props.requiredGroup - The group required for access (default: Finance_dept)
 * @returns {JSX.Element} Authorized content or access denied message
 */
const RoleBasedAccessControl = ({ children, requiredGroup = 'Finance_dept' }) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  const auth = useAuthContext();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userGroups, setUserGroups] = useState([]);

  // Convert single group to array for consistent processing
  const requiredGroups = Array.isArray(requiredGroup) ? requiredGroup : [requiredGroup];

  // ============================================================================
  // GROUP EXTRACTION LOGIC
  // ============================================================================

  /**
   * Extract user groups from Asgardeo authentication tokens
   * 
   * Attempts to find group membership information from multiple token sources:
   * 1. ID token (standard OpenID Connect claims)
   * 2. Access token (API authorization claims)  
   * 3. Basic user info (fallback)
   * 4. Authentication state (direct access)
   * 
   * @returns {Promise<string[]>} Array of user's group memberships
   */
  const extractUserGroups = async () => {
    console.log('=== EXTRACTING USER GROUPS - PAYSLIP UPLOADER DEBUG ===');
    try {
      // Method 1: Try to get groups from ID token
      const idToken = await auth?.getIDToken?.();
      console.log('ID Token:', idToken ? 'Present' : 'Missing');
      if (idToken) {
        const decodedIdToken = auth?.getDecodedIDToken?.();
        console.log('Decoded ID Token:', decodedIdToken);
        if (decodedIdToken) {
          const groups = decodedIdToken.groups || 
                        decodedIdToken['http://wso2.org/claims/role'] ||
                        decodedIdToken.roles ||
                        decodedIdToken.role ||
                        [];
          console.log('Groups from ID Token:', groups);
          
          if (groups && groups.length > 0) {
            return Array.isArray(groups) ? groups : [groups].filter(Boolean);
          }
        }
      }

      // Method 2: Try to get groups from access token
      const accessToken = await auth?.getAccessToken?.();
      console.log('Access Token:', accessToken ? 'Present' : 'Missing');
      if (accessToken) {
        try {
          // Decode JWT access token
          const tokenParts = accessToken.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            console.log('Access Token Payload:', payload);
            const groups = payload.groups || 
                          payload['http://wso2.org/claims/role'] ||
                          payload.roles ||
                          payload.role ||
                          [];
            console.log('Groups from Access Token:', groups);
            
            if (groups && groups.length > 0) {
              return Array.isArray(groups) ? groups : [groups].filter(Boolean);
            }
          }
        } catch (decodeError) {
          console.warn('Could not decode access token:', decodeError);
        }
      }

      // Method 3: Try to get groups from basic user info
      try {
        const basicUserInfo = await auth?.getBasicUserInfo?.();
        console.log('Basic User Info:', basicUserInfo);
        if (basicUserInfo) {
          const groups = basicUserInfo.groups || 
                        basicUserInfo['http://wso2.org/claims/role'] ||
                        basicUserInfo.roles ||
                        basicUserInfo.role ||
                        basicUserInfo['wso2_role'] ||
                        [];
          console.log('Groups from Basic User Info:', groups);
          
          if (groups && groups.length > 0) {
            return Array.isArray(groups) ? groups : [groups].filter(Boolean);
          }
        }
      } catch (userInfoError) {
        console.warn('Could not fetch user info:', userInfoError);
      }

      // Method 4: Check if access token payload has direct access
      try {
        const accessTokenPayload = auth?.state?.accessTokenPayload;
        const groups = accessTokenPayload?.groups || 
                      accessTokenPayload?.roles ||
                      accessTokenPayload?.role ||
                      accessTokenPayload['http://wso2.org/claims/role'] ||
                      [];
        
        if (groups) {
          return Array.isArray(groups) ? groups : [groups].filter(Boolean);
        }
      } catch (accessTokenError) {
        console.warn('Could not access token payload:', accessTokenError);
      }

      // No groups found in any token source
      console.log('No groups found in any token source');
      console.warn('User has no group memberships - access will be denied');
      
      return [];
    } catch (error) {
      console.error('Error extracting user groups:', error);
      throw error;
    }
  };

  /**
   * Check if user has required group membership
   * 
   * @param {string[]} userGroups - Array of user's group memberships
   * @param {string[]} requiredGroups - Array of required groups
   * @returns {boolean} True if user has at least one required group
   */
  const hasRequiredAccess = (userGroups, requiredGroups) => {
    return requiredGroups.some(requiredGroup => 
      userGroups.some(userGroup => 
        userGroup.toLowerCase().includes(requiredGroup.toLowerCase())
      )
    );
  };

  // ============================================================================
  // AUTHORIZATION EFFECT
  // ============================================================================

  /**
   * Effect: Check authorization when authentication state changes
   */
  useEffect(() => {
    const checkAuthorization = async () => {
      if (!auth?.state?.isAuthenticated) {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const groups = await extractUserGroups();
        setUserGroups(groups);
        
        const authorized = hasRequiredAccess(groups, requiredGroups);
        setIsAuthorized(authorized);
        
        console.log('=== PAYSLIP UPLOADER AUTHORIZATION DEBUG ===');
        console.log('User Groups Found:', groups);
        console.log('Required Groups:', requiredGroups);
        console.log('Authorization Result:', authorized);
        
        if (!authorized) {
          console.warn('🚫 ACCESS DENIED: User does not have required Finance_dept group membership');
          console.log('Available groups:', groups);
          console.log('Required groups:', requiredGroups);
        } else {
          console.log('✅ ACCESS GRANTED: User has required group membership');
        }
        
        console.log('===========================================');

      } catch (error) {
        console.error('Authorization check failed:', error);
        setIsAuthorized(false);
        setError('Authorization check failed');
      } finally {
        setLoading(false);
      }
    };

    checkAuthorization();
  }, [auth?.state?.isAuthenticated, JSON.stringify(requiredGroups)]);

  // ============================================================================
  // RENDER LOGIC
  // ============================================================================

  // Loading state
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ 
          textAlign: 'center', 
          maxWidth: 400,
          padding: '40px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #1890ff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <h3 style={{ color: '#1890ff', margin: '0 0 10px' }}>
            Verifying Access Permissions
          </h3>
          <p style={{ color: '#666', margin: 0 }}>
            Please wait while we verify your access to the Payslip Uploader...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ 
          textAlign: 'center', 
          maxWidth: 500,
          padding: '40px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          border: '1px solid #ffccc7'
        }}>
          <div style={{ fontSize: '48px', color: '#ff4d4f', marginBottom: '20px' }}>⚠️</div>
          <h2 style={{ color: '#ff4d4f', margin: '0 0 15px' }}>Authorization Error</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            {error}
          </p>
          <button
            onClick={() => auth?.signOut?.()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ff4d4f',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Unauthorized state
  if (!isAuthorized) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ 
          textAlign: 'center', 
          maxWidth: 500,
          padding: '40px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          border: '1px solid #ffccc7'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🚫</div>
          <h2 style={{ color: '#ff4d4f', margin: '0 0 15px' }}>Access Restricted</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            <strong>Payslip Uploader - Finance Department Only</strong>
          </p>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            This application is restricted to authorized Finance department personnel. 
            You must be a member of the Finance_dept group to access this system.
          </p>
          <p style={{ color: '#666', marginBottom: '30px' }}>
            If you believe you should have access, please contact your system administrator 
            to verify your group membership.
          </p>
          
          <div style={{ 
            backgroundColor: '#fff2e8', 
            border: '1px solid #ffcc99',
            borderRadius: '4px',
            padding: '15px',
            marginBottom: '25px',
            textAlign: 'left'
          }}>
            <strong style={{ color: '#d48806' }}>Required Access:</strong>
            <p style={{ margin: '5px 0 0', color: '#666' }}>
              You need to be a member of one of the following groups:
            </p>
            <ul style={{ margin: '5px 0 0 20px', color: '#666' }}>
              {requiredGroups.map(group => (
                <li key={group}><code>{group}</code></li>
              ))}
            </ul>
          </div>

          {userGroups.length > 0 && (
            <div style={{ 
              backgroundColor: '#f6ffed', 
              border: '1px solid #b7eb8f',
              borderRadius: '4px',
              padding: '15px',
              marginBottom: '25px',
              textAlign: 'left'
            }}>
              <strong style={{ color: '#389e0d' }}>Your Current Groups:</strong>
              <ul style={{ margin: '5px 0 0 20px', color: '#666' }}>
                {userGroups.map(group => (
                  <li key={group}><code>{group}</code></li>
                ))}
              </ul>
            </div>
          )}
          
          <button
            onClick={() => auth?.signOut?.()}
            style={{
              padding: '10px 24px',
              backgroundColor: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Authorized - render children
  return <>{children}</>;
};

export default RoleBasedAccessControl;
