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
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { BASE_URL, USER_INFO } from "@/constants/Constants";
import { apiRequest } from "@/utils/requestHandler";
import AsyncStorage from "@react-native-async-storage/async-storage";

<<<<<<< HEAD
export type UserInfo = {
  workEmail: string;
  firstName: string;
  lastName: string;
  employeeThumbnail: string | null;
};

interface AppsState {
  loading: boolean;
  userInfo: UserInfo | null;
  error: string | null;
}

=======
/**
 * Interface representing user information/profile data
 * Contains comprehensive user details retrieved from the backend
 */
export type UserInfo = {
  workEmail: string;                    // User's work email address
  firstName: string;                    // User's first name
  lastName: string;                     // User's last name
  employeeThumbnail: string | null;     // URL to user's profile picture/thumbnail
  department?: string;                  // User's department
  employeeID?: string;                  // Employee ID
  position?: string;                    // Job position/title
  phoneNumber?: string;                 // Contact phone number
  ministry?: string;                    // Ministry/organization
  branch?: string;                      // Branch office
  division?: string;                    // Division within department
  grade?: string;                       // Employee grade/level
  joinDate?: string;                    // Date of joining
  manager?: string;                     // Manager's name
  location?: string;                    // Work location
};

/**
 * State interface for the user info slice
 * Manages user profile information and API call status
 */
interface AppsState {
  loading: boolean;        // Loading state for async operations
  userInfo: UserInfo | null; // User information object or null if not loaded
  error: string | null;    // Error message if user info fetch fails
}

/**
 * Initial state for the user info slice
 */
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
const initialState: AppsState = {
  loading: false,
  userInfo: null,
  error: null,
};

<<<<<<< HEAD
// Async function to fetch user info
export const getUserInfo = createAsyncThunk(
  "userInfo/fetch",
  async (onLogout: () => Promise<void>, { rejectWithValue }) => {
    try {
      const response = await apiRequest(
        {
          url: `${BASE_URL}/user-info`,
          method: "GET",
        },
        onLogout
      );

      if (response?.status === 200) return response.data;
      else return rejectWithValue("User info not found");
=======
/**
 * Async thunk to fetch user information from the server
 * Retrieves user profile data including name, email, department, employee ID, and other details
 * 
 * @param onLogout - Callback function to handle logout on authentication failure
 * @returns Promise<UserInfo> - User information object
 */


/**
 * Async thunk to fetch detailed user information by email
 * Retrieves comprehensive user profile data including department, employee ID, etc.
 * 
 * @param params - Object containing email and onLogout callback
 * @returns Promise<UserInfo> - Detailed user information object
 */
export const getDetailedUserInfo = createAsyncThunk(
  "userInfo/fetchDetailed",
  async (
    params: { email: string; onLogout: () => Promise<void> },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiRequest(
        {
          url: `${BASE_URL}/user-info?email=${params.email}`,
          method: "GET",
        },
        params.onLogout
      );

      if (response?.status === 200) {
        const data = response.data;
        // Map the response to our UserInfo structure
        return {
          workEmail: params.email,
          firstName: data.firstName,
          lastName: data.lastName || '',
          employeeThumbnail: data.employeeThumbnail || null,
          department: data.department,
          employeeID: data.employeeID,
          position: data.position,
          phoneNumber: data.phoneNumber,
          ministry: data.ministry,
          branch: data.branch,
          division: data.division,
          grade: data.grade,
          joinDate: data.joinDate,
          manager: data.manager,
          location: data.location,
        };
      } else {
        return rejectWithValue("Detailed user info not found");
      }
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

<<<<<<< HEAD
=======
/**
 * User Info Redux Slice
 * 
 * This slice manages user profile information state and handles:
 * - Fetching basic and detailed user information from the server
 * - Managing loading states during API calls
 * - Handling errors during user info fetching
 * - Storing user data locally in AsyncStorage
 * - Manually setting user info when needed
 * 
 * State Structure:
 * - loading: Boolean indicating if a user info fetch is in progress
 * - userInfo: UserInfo object containing user profile data or null
 * - error: String containing error message if fetch fails, null otherwise
 * 
 * Actions:
 * - setUserInfo: Manually set user information
 * - getUserInfo.pending: Sets loading to true, clears errors
 * - getUserInfo.fulfilled: Sets loading to false, stores user info, saves to AsyncStorage
 * - getUserInfo.rejected: Sets loading to false, stores error message
 * - getDetailedUserInfo.pending: Sets loading to true, clears errors
 * - getDetailedUserInfo.fulfilled: Sets loading to false, stores detailed user info, saves to AsyncStorage
 * - getDetailedUserInfo.rejected: Sets loading to false, stores error message
 */
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
// Redux slice
const userInfoSlice = createSlice({
  name: "userInfo",
  initialState,
  reducers: {
    setUserInfo(state, action: PayloadAction<UserInfo>) {
      state.userInfo = action.payload || null;
    },
  },
  extraReducers: (builder) => {
    builder
<<<<<<< HEAD
      .addCase(getUserInfo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserInfo.fulfilled, (state, action) => {
=======

      .addCase(getDetailedUserInfo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDetailedUserInfo.fulfilled, (state, action) => {
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
        state.loading = false;
        state.userInfo = action.payload;

        AsyncStorage.setItem(USER_INFO, JSON.stringify(state.userInfo));
      })
<<<<<<< HEAD
      .addCase(getUserInfo.rejected, (state, action) => {
=======
      .addCase(getDetailedUserInfo.rejected, (state, action) => {
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setUserInfo } = userInfoSlice.actions;
export default userInfoSlice.reducer;
