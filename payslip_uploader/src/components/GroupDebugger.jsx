/**
 * Group Debugger Component for Payslip Uploader - FOR DEVELOPMENT ONLY
 * 
 * This component helps debug Asgardeo group membership issues
 * by displaying all available user information and tokens.
 * 
 * REMOVE THIS COMPONENT IN PRODUCTION!
 */

import React, { useState } from 'react';
import { useAuthContext } from '@asgardeo/auth-react';

const GroupDebugger = () => {
  const auth = useAuthContext();
  const [debugInfo, setDebugInfo] = useState(null);

  const extractAllUserInfo = async () => {
    const info = {
      authState: auth?.state,
      decodedIdToken: null,
      accessTokenPayload: null,
      basicUserInfo: null,
      rawTokens: {
        idToken: null,
        accessToken: null
      }
    };

    try {
      // Get decoded ID token
      info.decodedIdToken = auth?.getDecodedIDToken?.();
      
      // Get basic user info
      info.basicUserInfo = await auth?.getBasicUserInfo?.();
      
      // Get raw tokens
      info.rawTokens.idToken = await auth?.getIDToken?.();
      info.rawTokens.accessToken = await auth?.getAccessToken?.();
      
      // Decode access token
      if (info.rawTokens.accessToken) {
        try {
          const tokenParts = info.rawTokens.accessToken.split('.');
          if (tokenParts.length === 3) {
            info.accessTokenPayload = JSON.parse(atob(tokenParts[1]));
          }
        } catch (e) {
          info.accessTokenPayload = { error: 'Could not decode access token' };
        }
      }
      
    } catch (error) {
      info.error = error.message;
    }

    setDebugInfo(info);
    console.log('=== PAYSLIP UPLOADER USER DEBUG INFO ===', info);
  };

  return (
    <div style={{ 
      background: '#fff3cd', 
      border: '1px solid #ffeaa7', 
      borderRadius: '8px', 
      padding: '20px', 
      margin: '20px 0',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h3 style={{ margin: '0 0 15px', color: '#856404' }}>
        🔍 Group Membership Debugger (DEV ONLY)
      </h3>
      <button 
        onClick={extractAllUserInfo}
        style={{
          padding: '8px 16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '15px'
        }}
      >
        Extract All User Information
      </button>
      
      {debugInfo && (
        <div>
          <div style={{ marginBottom: '15px' }}>
            <strong>Authentication State:</strong>
            <pre style={{ 
              background: '#f8f9fa', 
              padding: '10px', 
              fontSize: '12px', 
              overflow: 'auto',
              maxHeight: '150px',
              border: '1px solid #dee2e6',
              borderRadius: '4px'
            }}>
              {JSON.stringify(debugInfo.authState, null, 2)}
            </pre>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <strong>Decoded ID Token:</strong>
            <pre style={{ 
              background: '#f8f9fa', 
              padding: '10px', 
              fontSize: '12px', 
              overflow: 'auto',
              maxHeight: '150px',
              border: '1px solid #dee2e6',
              borderRadius: '4px'
            }}>
              {JSON.stringify(debugInfo.decodedIdToken, null, 2)}
            </pre>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <strong>Access Token Payload:</strong>
            <pre style={{ 
              background: '#f8f9fa', 
              padding: '10px', 
              fontSize: '12px', 
              overflow: 'auto',
              maxHeight: '150px',
              border: '1px solid #dee2e6',
              borderRadius: '4px'
            }}>
              {JSON.stringify(debugInfo.accessTokenPayload, null, 2)}
            </pre>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <strong>Basic User Info:</strong>
            <pre style={{ 
              background: '#f8f9fa', 
              padding: '10px', 
              fontSize: '12px', 
              overflow: 'auto',
              maxHeight: '150px',
              border: '1px solid #dee2e6',
              borderRadius: '4px'
            }}>
              {JSON.stringify(debugInfo.basicUserInfo, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDebugger;
