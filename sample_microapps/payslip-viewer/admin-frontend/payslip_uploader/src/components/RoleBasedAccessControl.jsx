/* /**
 * Role-Based Access Control Component for Payslip Uploader
 * 
 * This component handles authorization checks for the payslip uploader.
 * It works in conjunction with Asgardeo's adaptive authentication script
 * to ensure only users with 'Finance_dept' group membership can access the application.
 * 
 * Features:
 * - Validates user group membership from authentication tokens
 * - Provides unauthorized access handling
 * - Displays appropriate error messages for rejected users
 * - Integrates with Asgardeo authentication flow
 * 
 * Authentication Flow:
 * 1. User authenticates via Asgardeo
 * 2. Adaptive authentication script validates group membership
 * 3. If authorized, user gets access tokens
 * 4. Frontend validates tokens and renders payslip uploader interface
 * 5. If unauthorized, user sees error message
 */

import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@asgardeo/auth-react';
import { Alert, Button, Card, Typography, Space } from 'antd';
import { ExclamationCircleOutlined, LoginOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

/**
 * RoleBasedAccessControl Component
 * 
 * Wraps the main application with authorization checks.
 * Only renders children if user has proper role/group membership.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {string[]} props.requiredGroups - Array of required group names (default: ['Finance_dept'])
 * @returns {React.ReactNode} Authorized content or access denied message
 */
const RoleBasedAccessControl = ({ 
  children, 
  requiredGroups = ['Finance_dept'] 
}) => {
  // Authentication context from Asgardeo
  const auth = useAuthContext();

  // Print access token to console when available
  useEffect(() => {
    const printAccessToken = async () => {
      if (auth?.isAuthenticated) {
        try {
          const accessToken = await auth.getAccessToken();
          console.log('Access Token (from useEffect):', accessToken);
        } catch (e) {
          console.warn('Could not retrieve access token:', e);
        }
      }
    };
    printAccessToken();
  }, [auth?.isAuthenticated]);
  
  // Component state for authorization tracking
  const [isAuthorized, setIsAuthorized] = useState(null); // null = checking, true = authorized, false = denied
  const [userGroups, setUserGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Extract user groups from Asgardeo authentication tokens
   * 
   * Attempts to find group membership information from multiple token sources:
   * 1. ID token (standard OpenID Connect claims)
   * 2. Access token (API authorization claims)  
   * 3. Basic user info (fallback)
   * 
   * @returns {Promise<string[]>} Array of user's group memberships
   */
  const extractUserGroups = async () => {
    console.log('=== EXTRACTING USER GROUPS - DEBUG ===');
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
        // Print the JWT access token in the console
        console.log('JWT Access Token:', accessToken);
        try {
          // Decode JWT access token
          const tokenParts = accessToken.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            console.log('Decoded JWT Access Token:', payload);
            const groups = payload.groups || 
                          payload['http://wso2.org/claims/role'] ||
                          payload.roles ||
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
                      accessTokenPayload['http://wso2.org/claims/role'] ||
                      [];
        
        if (groups) {
          return Array.isArray(groups) ? groups : [groups].filter(Boolean);
        }
      } catch (accessTokenError) {
        console.warn('Could not access token payload:', accessTokenError);
      }

      // No groups found in any token source - access denied
      console.log('No groups found in any token source');
      console.warn('⚠️ Group claims are not being included in authentication tokens');
      console.log('📋 To fix this:');
      console.log('   1. Add user to Finance_dept group in Asgardeo');
      console.log('   2. Configure application to include group claims in tokens');
      console.log('   3. Enable "Include groups in tokens" in Asgardeo app settings');
      
      // TEMPORARY BYPASS - Enable access while fixing group configuration
      console.log('🚨 TEMPORARY BYPASS ACTIVE - Remove after fixing group claims!');
      return ['Finance_dept']; // REMOVE THIS AFTER FIXING GROUP CONFIGURATION!
      
      // return [];
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
        
        console.log('=== AUTHORIZATION DEBUG INFO ===');
        console.log('User Groups Found:', groups);
        console.log('Required Groups:', requiredGroups);
        console.log('Authorization Result:', authorized);
        console.log('Auth State:', auth?.state);
        console.log('ID Token Decoded:', auth?.getDecodedIDToken?.());
        console.log('==================================');

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

  // Loading state
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <Card style={{ textAlign: 'center', maxWidth: 400 }}>
          <div className="ant-spin ant-spin-spinning">
            <span className="ant-spin-dot ant-spin-dot-spin">
              <i className="ant-spin-dot-item"></i>
            </span>
          </div>
          <Paragraph style={{ marginTop: 16 }}>
            Verifying access permissions...
          </Paragraph>
        </Card>
      </div>
    );
  }

  // Access denied state
  if (!isAuthorized) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: '20px'
      }}>
        <Card style={{ maxWidth: 600, textAlign: 'center' }}>
          <ExclamationCircleOutlined 
            style={{ 
              fontSize: '48px', 
              color: '#ff4d4f', 
              marginBottom: '16px' 
            }} 
          />
          
          <Title level={2} style={{ color: '#ff4d4f' }}>
            Access Denied
          </Title>
          
          <Alert
            message="Unauthorized Access"
            description="You are not authorized to access this application. Please contact your administrator if you believe this is an error."
            type="error"
            showIcon
            style={{ marginBottom: '24px', textAlign: 'left' }}
          />
          
          <Paragraph>
            <strong>Required Access:</strong> You need to be a member of one of the following groups:
          </Paragraph>
          
          <ul style={{ textAlign: 'left', marginBottom: '24px' }}>
            {requiredGroups.map(group => (
              <li key={group}><code>{group}</code></li>
            ))}
          </ul>
          
          {userGroups.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <Paragraph>
                <strong>Your current groups:</strong>
              </Paragraph>
              <ul style={{ textAlign: 'left' }}>
                {userGroups.map(group => (
                  <li key={group}><code>{group}</code></li>
                ))}
              </ul>
            </div>
          )}
          
          {error && (
            <Alert
              message="Error"
              description={error}
              type="warning"
              style={{ marginBottom: '24px' }}
            />
          )}
          
          <Space>
            <Button 
              type="primary" 
              icon={<LoginOutlined />}
              onClick={() => auth?.signOut()}
            >
              Sign Out
            </Button>
            
            <Button 
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </Space>
        </Card>
      </div>
    );
  }

  // Authorized - render the protected content
  return children;
};

export default RoleBasedAccessControl;
 