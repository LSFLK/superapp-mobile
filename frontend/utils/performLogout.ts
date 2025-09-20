import { APPS, AUTH_DATA, USER_INFO } from "@/constants/Constants";
import { ScreenPaths } from "@/constants/ScreenPaths";
import { resetAll } from "@/context/slices/authSlice";
import { persistor, store } from "@/context/store";
import { logout } from "@/services/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UpdateUserAppList } from "@/services/userConfigService";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { router } from "expo-router";
import { Alert } from "react-native";

// Logout user
export const performLogout = createAsyncThunk(
  "auth/logout",
  async (_, { dispatch }) => {
    try {
      // // Before logging out, persist local app list to backend
      // try {
      //   const state = store.getState();
      //   const localAppIds = state.apps.apps.filter((a: any) => a?.status === "downloaded").map((a: any) => a.app_id);
      //   if (localAppIds.length > 0) {
      //     await UpdateUserAppList(localAppIds, async () => Promise.resolve());
      //   }
      // } catch (err) {
      //   console.error("Failed to update app list on logout:", err);
      // }

      await logout(); // Call Asgardeo logout
      await persistor.purge(); // Clear redux-persist storage
      dispatch(resetAll()); // Reset Redux state completely

  await AsyncStorage.removeItem(AUTH_DATA);
  // await AsyncStorage.removeItem(APPS);
  await AsyncStorage.removeItem(USER_INFO);

      Alert.alert(
        "Logout Successful",
        "You have been logged out successfully.",
        [
          {
            text: "OK",
            onPress: () => router.navigate(ScreenPaths.LOGIN),
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error("Logout error:", error);
    }
  }
);
