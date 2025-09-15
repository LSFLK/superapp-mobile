import { BASE_URL, USER_CONFIGURATIONS } from "@/constants/Constants";
import { apiRequest } from "@/utils/requestHandler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

/**
 * Interface representing the arrangement of apps in user's custom layout
 * Used for organizing apps in folders or custom arrangements
 */
interface AppArrangement {
  name: string;         // Name of the arrangement or folder
  isDirectory: boolean; // Whether this is a folder/directory
  apps: string[];       // Array of app IDs in this arrangement
}

/**
 * Interface representing a user configuration setting
 * Stores user-specific preferences and customizations
 */
export interface UserConfig {
  email: string;                                    // User's email address
  configKey: string;                               // Configuration key identifier
  configValue: string[] | AppArrangement[];       // Configuration value (can be strings or app arrangements)
  isActive: number;                                // Flag indicating if config is active (1) or inactive (0)
}

/**
 * State interface for the user configuration slice
 * Manages user-specific settings and preferences
 */
interface UserConfigState {
  configurations: UserConfig[]; // Array of user configurations
  loading: boolean;             // Loading state for async operations
}

/**
 * Initial state for the user configuration slice
 */
const initialState: UserConfigState = {
  configurations: [],
  loading: false,
};

/**
 * Async thunk to fetch user configurations from the server
 * Retrieves user-specific settings like app arrangements, preferences, etc.
 * 
 * @param onLogout - Callback function to handle logout on authentication failure
 * @returns Promise<UserConfig[]> - Array of user configurations
 */
// Async function to fetch user configurations
export const getUserConfigurations = createAsyncThunk(
  "userConfig/fetch",
  async (onLogout: () => Promise<void>, { rejectWithValue }) => {
    try {
      const response = await apiRequest(
        { url: `${BASE_URL}/users/app-configs`, method: "GET" },
        onLogout
      );

      if (response?.status === 200 && response?.data) {
        await AsyncStorage.setItem(
          USER_CONFIGURATIONS,
          JSON.stringify(response.data)
        );
        return response.data;
      } else {
        return [];
      }
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * User Configuration Redux Slice
 * 
 * This slice manages user-specific configuration state and handles:
 * - Fetching user configurations from the server
 * - Managing loading states during API calls
 * - Storing configuration data locally in AsyncStorage
 * - Handling user preferences like app arrangements and settings
 * 
 * State Structure:
 * - configurations: Array of UserConfig objects containing user settings
 * - loading: Boolean indicating if a configuration fetch is in progress
 * 
 * Actions:
 * - getUserConfigurations.pending: Sets loading to true
 * - getUserConfigurations.fulfilled: Sets loading to false, stores configurations
 * - getUserConfigurations.rejected: Sets loading to false on error
 */
// Redux slice
const userConfigSlice = createSlice({
  name: "userConfig",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getUserConfigurations.pending, (state) => {
        state.loading = true;
      })
      .addCase(getUserConfigurations.fulfilled, (state, action) => {
        state.loading = false;
        state.configurations = action.payload || [];
      })
      .addCase(getUserConfigurations.rejected, (state, action) => {
        state.loading = false;
      });
  },
});

export default userConfigSlice.reducer;
