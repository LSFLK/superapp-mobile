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
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { APPS } from "@/constants/Constants";

<<<<<<< HEAD
export type Version = {
  version: string;
  build: number;
  releaseNotes: string;
  downloadUrl: string;
  iconUrl: string;
};

export type MicroApp = {
  name: string;
  description: string;
  promoText: string;
  appId: string;
  iconUrl: string;
  bannerImageUrl: string;
  isMandatory: number;
  versions: Version[];
  status?: string | "";
  webViewUri?: string | "";
  clientId?: string | "";
  exchangedToken?: string | "";
};

interface AppsState {
  apps: MicroApp[];
  downloading: string[];
}

=======
/**
 * Interface representing a version of a micro-app
 * Contains version-specific information for micro-app downloads
 */
export type Version = {
  version: string;      // Version string (e.g., "1.2.3")
  build: number;        // Build number for the version
  releaseNotes: string; // Description of changes in this version
  downloadUrl: string;  // URL to download this version
  iconUrl: string;      // URL to the app icon
};

/**
 * Interface representing a micro-app in the super app ecosystem
 * Contains all information needed to display, download, and launch micro-apps
 */
export type MicroApp = {
  name: string;         // Display name of the micro-app
  description: string;  // Detailed description of the app
  promoText: string;    // Promotional text for marketing
  appId: string;        // Unique identifier for the app
  iconUrl: string;      // URL to the app icon
  bannerImageUrl: string; // URL to the banner image
  isMandatory: number;  // Flag indicating if app is mandatory (1) or optional (0)
  versions: Version[];  // Array of available versions
  status?: string | ""; // Current status of the app (installed, downloading, etc.)
  webViewUri?: string | ""; // URI for web view if applicable
  clientId?: string | ""; // OAuth client ID for authentication
  exchangedToken?: string | ""; // Token for authenticated requests
  downloadedAt?: number; // Timestamp when app was downloaded (for "Ready" badge)
};

/**
 * State interface for the apps slice
 * Manages the state of micro-apps and their download status
 */
interface AppsState {
  apps: MicroApp[];     // Array of available micro-apps
  downloading: string[]; // Array of app IDs currently being downloaded
}

/**
 * Initial state for the apps slice
 */
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
const initialState: AppsState = {
  apps: [],
  downloading: [],
};

<<<<<<< HEAD
=======
/**
 * Apps Redux Slice
 * 
 * This slice manages the micro-apps ecosystem state and handles:
 * - Storing and updating micro-app information
 * - Tracking download status of apps
 * - Managing app authentication tokens and status
 * - Persisting app data to AsyncStorage
 * 
 * State Structure:
 * - apps: Array of MicroApp objects containing app information
 * - downloading: Array of app IDs currently being downloaded
 * 
 * Actions:
 * - setApps: Replace all apps with new array
 * - addDownloading: Add an app ID to the downloading list
 * - removeDownloading: Remove an app ID from the downloading list
 * - updateAppStatus: Update app status, URI, and client info
 * - updateExchangedToken: Update authentication token for an app
 */
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
const appsSlice = createSlice({
  name: "apps",
  initialState,
  reducers: {
    setApps(state, action: PayloadAction<MicroApp[]>) {
      state.apps = action.payload || [];
    },
    addDownloading(state, action: PayloadAction<string>) {
      state.downloading.push(action.payload);
    },
    removeDownloading(state, action: PayloadAction<string>) {
      state.downloading = state.downloading.filter(
        (appId) => appId !== action.payload
      );
    },
    updateAppStatus: (
      state,
      action: PayloadAction<{
        appId: string;
        status: string;
        webViewUri: string;
        clientId: string;
        exchangedToken?: string;
      }>
    ) => {
      const { appId, status, webViewUri, clientId, exchangedToken } =
        action.payload;
      const app = state.apps.find((app) => app.appId === appId);
      if (app) {
        app.status = status;
        app.webViewUri = webViewUri;
        app.clientId = clientId;
        if (exchangedToken) {
          app.exchangedToken = exchangedToken;
        } else app.exchangedToken = "";
<<<<<<< HEAD
=======
        
        // Set downloadedAt timestamp when app is newly downloaded
        if (status === "downloaded") {
          app.downloadedAt = Date.now();
        }
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
      }

      // Ensure state is saved in AsyncStorage immediately
      AsyncStorage.setItem(APPS, JSON.stringify(state.apps));
    },
    updateExchangedToken: (
      state,
      action: PayloadAction<{ appId: string; exchangedToken: string }>
    ) => {
      const { appId, exchangedToken } = action.payload;
      const app = state.apps.find((app) => app.appId === appId);
      if (app) app.exchangedToken = exchangedToken;

      // Ensure state is saved in AsyncStorage immediately
      AsyncStorage.setItem(APPS, JSON.stringify(state.apps));
    },
<<<<<<< HEAD
=======
    markAppAsViewed: (
      state,
      action: PayloadAction<{ appId: string }>
    ) => {
      const { appId } = action.payload;
      const app = state.apps.find((app) => app.appId === appId);
      if (app && app.downloadedAt) {
        // Set downloadedAt to 25 hours ago to remove "Ready" badge
        app.downloadedAt = Date.now() - (25 * 60 * 60 * 1000);
      }

      // Ensure state is saved in AsyncStorage immediately
      AsyncStorage.setItem(APPS, JSON.stringify(state.apps));
    },
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
  },
});

export const {
  setApps,
  addDownloading,
  removeDownloading,
  updateAppStatus,
  updateExchangedToken,
<<<<<<< HEAD
=======
  markAppAsViewed,
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
} = appsSlice.actions;
export default appsSlice.reducer;
