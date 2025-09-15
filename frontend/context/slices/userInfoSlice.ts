import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { BASE_URL, USER_INFO } from "@/constants/Constants";
import { apiRequest } from "@/utils/requestHandler";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Interface representing user information/profile data
 * Contains basic user details retrieved from the backend
 */
export type UserInfo = {
  workEmail: string;              // User's work email address
  firstName: string;              // User's first name
  lastName: string;               // User's last name
  employeeThumbnail: string | null; // URL to user's profile picture/thumbnail
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
const initialState: AppsState = {
  loading: false,
  userInfo: null,
  error: null,
};

/**
 * Async thunk to fetch user information from the server
 * Retrieves user profile data including name, email, and profile picture
 * 
 * @param onLogout - Callback function to handle logout on authentication failure
 * @returns Promise<UserInfo> - User information object
 */
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
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * User Info Redux Slice
 * 
 * This slice manages user profile information state and handles:
 * - Fetching user information from the server
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
 */
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
      .addCase(getUserInfo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserInfo.fulfilled, (state, action) => {
        state.loading = false;
        state.userInfo = action.payload;

        AsyncStorage.setItem(USER_INFO, JSON.stringify(state.userInfo));
      })
      .addCase(getUserInfo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setUserInfo } = userInfoSlice.actions;
export default userInfoSlice.reducer;
