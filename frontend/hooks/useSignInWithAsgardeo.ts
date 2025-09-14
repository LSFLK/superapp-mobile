// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.
import { AUTH_CONFIG } from "@/config/authConfig";
import { setAuth, setAuthWithCheck } from "@/context/slices/authSlice";
import { AppDispatch } from "@/context/store";
import { processNativeAuthResult, AuthData } from "@/services/authService";
import { AuthorizeResult, authorize } from "react-native-app-auth";
import { useDispatch } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AUTH_DATA } from "@/constants/Constants";

export const useSignInWithAsgardeo = () => {
  const dispatch = useDispatch<AppDispatch>();

  const signIn = async () => {
    try {
      // TEMPORARY MOCK DATA - Replace with real OAuth flow once fixed
      console.log("Using mock authentication data for development");
      
      const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
      const expirationTime = currentTime + (24 * 60 * 60); // 24 hours from now
      
      // Mock Access Token - JWT with proper structure and user claims
      const accessTokenPayload = {
        sub: "mock_user_12345",
        aud: "mock_client_id",
        scope: "openid email groups",
        iss: "https://api.asgardeo.io/t/govsupapp/oauth2/token",
        exp: expirationTime,
        iat: currentTime,
        jti: "mock_jti_" + Date.now(),
        // User profile claims (what the app expects in access token)
        email: "mockuser@gov.com",
        given_name: "Mock",
        family_name: "User",
        name: "Mock User",
        email_verified: true,
        groups: ["everyone", "mock_group"]
      };
      
      // Mock ID Token - JWT with user claims
      const idTokenPayload = {
        sub: "mock_user_12345",
        email: "mockuser@example.com",
        email_verified: true,
        name: "Mock User",
        given_name: "Mock",
        family_name: "User",
        aud: "mock_client_id",
        iss: "https://api.asgardeo.io/t/govsupapp/oauth2/token",
        exp: expirationTime,
        iat: currentTime,
        auth_time: currentTime,
        groups: ["everyone", "mock_group"]
      };
      
      // Create valid JWT tokens (Base64 encoded)
      const accessToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Im1vY2tfa2V5In0." + 
        btoa(JSON.stringify(accessTokenPayload)) + 
        ".mock_signature_" + Date.now();
        
      const idToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Im1vY2tfa2V5In0." + 
        btoa(JSON.stringify(idTokenPayload)) + 
        ".mock_signature_" + Date.now();
      
      const mockAuthData: AuthData = {
        accessToken: accessToken,
        refreshToken: "mock_refresh_token_" + Date.now(),
        idToken: idToken,
        email: "mockuser@example.com",
        expiresAt: expirationTime * 1000, // Convert back to milliseconds
      };

      // Store the mock data in AsyncStorage
      await AsyncStorage.setItem(AUTH_DATA, JSON.stringify(mockAuthData));
      
      // Dispatch the mock auth data to Redux store
      dispatch(setAuth(mockAuthData));
      dispatch(setAuthWithCheck(mockAuthData));
      
      console.log("Mock authentication successful");
      
      // Uncomment below for real OAuth flow once the configuration is fixed
      /*
      const authState: AuthorizeResult = await authorize(AUTH_CONFIG);
      const authData = await processNativeAuthResult(authState);
      if (authData) {
        dispatch(setAuth(authData));
        dispatch(setAuthWithCheck(authData));
      }
      */
    } catch (error) {
      console.error("Authentication failed:", error);
    }
  };

  return signIn;
};
