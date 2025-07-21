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
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useAuthRequest } from "expo-auth-session";
import { CLIENT_ID, REDIRECT_URI, SUCCESS } from "@/constants/Constants";
import { getAccessToken } from "@/services/authService";
import { setAuth, setAuthWithCheck } from "@/context/slices/authSlice";
import { useDiscovery } from "@/hooks/useDiscovery";
import { AppDispatch } from "@/context/store";
import { Platform } from "react-native";

export const useSignInWithAsgardeo = () => {
  const discovery = useDiscovery();
  const redirectUri = REDIRECT_URI;
  const dispatch = useDispatch<AppDispatch>();

  const [request, result, promptAsync] = useAuthRequest(
    {
      clientId: CLIENT_ID,
      responseType: "code",
      scopes: ["openid", "profile", "email", "groups"],
      redirectUri,
    },
    discovery
  );

  // Automatically handle auth result
  useEffect(() => {
    const handleAuthResult = async () => {
      if (result?.type === SUCCESS && request) {
        const authData = await getAccessToken(request, result, redirectUri);
        if (authData) {
          dispatch(setAuth(authData));
          dispatch(setAuthWithCheck(authData));
        }
      }
    };

    handleAuthResult();
  }, [result]);

  return {
    request,
    promptAsync:
      Platform.OS === "ios"
        ? promptAsync
        : () => promptAsync({ createTask: false, showInRecents: false }),
  };
};
