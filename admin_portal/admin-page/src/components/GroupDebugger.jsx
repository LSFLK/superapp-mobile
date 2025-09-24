/**
 * Group Debugger Component - FOR DEVELOPMENT ONLY
 * 
 * This component helps debug Asgardeo group membership issues
 * by displaying all available user information and tokens.
 * 
 * REMOVE THIS COMPONENT IN PRODUCTION!
 */

import React, { useState } from 'react';
import { useAuthContext } from '@asgardeo/auth-react';
import { Card, Button, Divider } from 'antd';

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
    console.log('=== COMPLETE USER DEBUG INFO ===', info);
  };

  return (
    <Card title="🔍 Group Membership Debugger (DEV ONLY)" style={{ margin: '20px 0' }}>
      <Button onClick={extractAllUserInfo} type="primary">
        Extract All User Information
      </Button>
      
      {debugInfo && (
        <div style={{ marginTop: 20 }}>
          <Divider>Authentication State</Divider>
          <pre style={{ background: '#f5f5f5', padding: 10, fontSize: 12, overflow: 'auto' }}>
            {JSON.stringify(debugInfo.authState, null, 2)}
          </pre>
          
          <Divider>Decoded ID Token</Divider>
          <pre style={{ background: '#f5f5f5', padding: 10, fontSize: 12, overflow: 'auto' }}>
            {JSON.stringify(debugInfo.decodedIdToken, null, 2)}
          </pre>
          
          <Divider>Access Token Payload</Divider>
          <pre style={{ background: '#f5f5f5', padding: 10, fontSize: 12, overflow: 'auto' }}>
            {JSON.stringify(debugInfo.accessTokenPayload, null, 2)}
          </pre>
          
          <Divider>Basic User Info</Divider>
          <pre style={{ background: '#f5f5f5', padding: 10, fontSize: 12, overflow: 'auto' }}>
            {JSON.stringify(debugInfo.basicUserInfo, null, 2)}
          </pre>
        </div>
      )}
    </Card>
  );
};

export default GroupDebugger;
