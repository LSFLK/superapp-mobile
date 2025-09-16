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
import { BASE_URL } from "@/constants/Constants";
import { apiRequest } from "@/utils/requestHandler";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Platform } from "react-native";

<<<<<<< HEAD
export interface Version {
  version: string;
  build: number;
  platform: "android" | "ios";
  releaseNotes: string;
  downloadUrl: string;
}

interface VersionState {
  versions: Version[];
  loading: boolean;
  error: string | null;
}

=======
/**
 * Interface representing a version of the application
 * Contains information about app versions available for download and update
 */
export interface Version {
  version: string;      // Version string (e.g., "1.2.3")
  build: number;        // Build number for the version
  platform: "android" | "ios";  // Target platform
  releaseNotes: string; // Description of changes in this version
  downloadUrl: string;  // URL to download this version
}

/**
 * State interface for the version slice
 * Manages the state of app version information and API call status
 */
interface VersionState {
  versions: Version[];  // Array of available app versions
  loading: boolean;     // Loading state for async operations
  error: string | null; // Error message if version fetch fails
}

/**
 * Initial state for the version slice
 * Default values when the app starts or slice is reset
 */
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
const initialState: VersionState = {
  versions: [],
  loading: false,
  error: null,
};

<<<<<<< HEAD
=======
/**
 * Async thunk to fetch available app versions from the server
 * Retrieves versions specific to the current platform (iOS/Android)
 * 
 * @param onLogout - Callback function to handle logout on authentication failure
 * @returns Promise<Version[]> - Array of available versions for the current platform
 */
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
// Async function to fetch versions
export const getVersions = createAsyncThunk(
  "version/fetch",
  async (onLogout: () => Promise<void>, { rejectWithValue }) => {
    try {
      const response = await apiRequest(
        {
          url: `${BASE_URL}/versions?platform=${Platform.OS}`,
          method: "GET",
        },
        onLogout
      );

      if (response?.data) return response.data;
      else rejectWithValue("Version data not found");
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

<<<<<<< HEAD
=======
/**
 * Version Redux Slice
 * 
 * This slice manages the application version state and handles:
 * - Fetching available app versions from the server
 * - Managing loading states during API calls
 * - Handling errors during version fetching
 * - Storing version data for update checks and notifications
 * 
 * State Structure:
 * - versions: Array of Version objects containing version info
 * - loading: Boolean indicating if a version fetch is in progress
 * - error: String containing error message if fetch fails, null otherwise
 * 
 * Actions:
 * - getVersions.pending: Sets loading to true, clears errors
 * - getVersions.fulfilled: Sets loading to false, stores fetched versions
 * - getVersions.rejected: Sets loading to false, stores error message
 */
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
// Redux slice
const versionSlice = createSlice({
  name: "version",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getVersions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getVersions.fulfilled, (state, action) => {
        state.loading = false;
        state.versions = action.payload || [];
      })
      .addCase(getVersions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default versionSlice.reducer;
