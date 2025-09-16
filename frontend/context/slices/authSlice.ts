<<<<<<< HEAD
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
=======
/**
 * Represents the authentication state slice for the application.
 *
 * @remarks
 * This slice manages authentication-related state, including tokens and user email.
 * It provides reducers for setting authentication data and resetting the state,
 * as well as handling asynchronous actions via extra reducers.
 *
 * @interface AuthState
 * @property {string | null} accessToken - The access token for authenticated requests.
 * @property {string | null} refreshToken - The refresh token for renewing access.
 * @property {string | null} idToken - The ID token for user identification.
 * @property {string | null} email - The authenticated user's email address.
 * @property {boolean} isLoading - Indicates if authentication state is being loaded.
 *
 * @function setAuth
 * Sets authentication tokens and user email in the state, and marks loading as complete.
 *
 * @function resetAll
 * Resets the authentication state to its initial values.
 *
 * @function restoreAuth.fulfilled
 * Handles successful restoration of authentication state from persisted storage.
 *
 * @function setAuthWithCheck.fulfilled
 * Marks authentication loading as complete after a check.
 */

>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  AuthData,
  loadAuthData,
  logout,
  refreshAccessToken,
} from "../../services/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { removeGoogleAuthState } from "@/services/googleService";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  idToken: string | null;
  email: AuthData["email"] | null;
  isLoading: boolean;
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  idToken: null,
  email: null,
  isLoading: false,
};

// Async action to restore persisted auth state
export const restoreAuth = createAsyncThunk("auth/restoreAuth", async () => {
  let authData = await loadAuthData();

  if (authData) {
    const isExpired = authData.expiresAt && Date.now() >= authData.expiresAt;

    if (isExpired) {
      authData = await refreshAccessToken(logout);
    }

    return authData;
  }

  return null;
});

// Async action to set auth and check Google auth state
export const setAuthWithCheck = createAsyncThunk(
  "auth/setAuthWithCheck",
  async (authPayload: AuthData, { dispatch }) => {
    const previousAuthMail = await AsyncStorage.getItem("authMail");
    if (previousAuthMail) {
      const parsedMail = JSON.parse(previousAuthMail);
      if (authPayload.email && authPayload.email !== parsedMail) {
        await removeGoogleAuthState();
      }
    }

    await AsyncStorage.setItem("authMail", JSON.stringify(authPayload.email));
    dispatch(setAuth(authPayload));
  }
);

<<<<<<< HEAD
=======

>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.idToken = action.payload.idToken;
      state.email = action.payload.email;
      state.isLoading = false;
    },
    resetAll: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreAuth.fulfilled, (state, action) => {
        if (action.payload) {
          state.accessToken = action.payload.accessToken;
          state.refreshToken = action.payload.refreshToken;
          state.idToken = action.payload.idToken;
          state.email = action.payload.email;
        }
        state.isLoading = false;
      })
      .addCase(setAuthWithCheck.fulfilled, (state) => {
        state.isLoading = false;
      });
  },
});

export const { setAuth, resetAll } = authSlice.actions;
export default authSlice.reducer;
