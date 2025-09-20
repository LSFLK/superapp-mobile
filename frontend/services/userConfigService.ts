import {
  APP_LIST_CONFIG_KEY,
  BASE_URL,
  DOWNLOADED,
  USER_CONFIGURATIONS,
} from "@/constants/Constants";
import { UserConfig } from "@/context/slices/userConfigSlice";
import { apiRequest } from "@/utils/requestHandler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { store } from "@/context/store";

// Send downloaded appId to backend (user configurations)
export const UpdateUserConfiguration = async (
  appId: string,
  action: "downloaded" | "not-downloaded",
  onLogout: () => Promise<void>
) => {
  try {
    // Get the latest state directly from AsyncStorage each time
    const storedUserConfigsJson = await AsyncStorage.getItem(
      USER_CONFIGURATIONS
    );
    let storedUserConfigs: UserConfig[] = storedUserConfigsJson
      ? JSON.parse(storedUserConfigsJson)
      : [];

    if (storedUserConfigs.length === 0) {
      const state = store.getState();
      const email = state.auth.email;

      if (!email) {
        console.error("User email not found in auth state.");
        return false;
      }

      storedUserConfigs = [
        {
          configKey: APP_LIST_CONFIG_KEY,
          configValue: [],
          email,
          isActive: 1,
        },
      ];
    }

    const appUserConfigs = storedUserConfigs.find(
      (config) => config.configKey === APP_LIST_CONFIG_KEY
    );

    if (!appUserConfigs) {
      console.warn("User config not found or invalid format.");
      return;
    }

    let updatedConfigValue = Array.isArray(appUserConfigs.configValue)
      ? [...appUserConfigs.configValue]
      : [];

    if (action === DOWNLOADED) {
      if (!updatedConfigValue.includes(appId)) {
        updatedConfigValue.push(appId);
      }
    } else {
      updatedConfigValue = updatedConfigValue.filter((id) => id !== appId);
    }

    const updatedUserConfigs = storedUserConfigs.map((config) =>
      config.configKey === APP_LIST_CONFIG_KEY
        ? { ...config, configValue: updatedConfigValue }
        : { ...config }
    );

    await AsyncStorage.setItem(
      USER_CONFIGURATIONS,
      JSON.stringify(updatedUserConfigs)
    );

    const response = await apiRequest(
      {
        url: `${BASE_URL}/users/app-configs`,
        method: "POST",
        data: {
          configKey: APP_LIST_CONFIG_KEY,
          configValue: updatedConfigValue,
          email: appUserConfigs.email,
          isActive: appUserConfigs.isActive,
        },
      },
      onLogout
    );

    if (response?.status !== 201) {
      console.warn(
        "Failed to update user config on server. Status:",
        response?.status
      );

      await AsyncStorage.setItem(
        USER_CONFIGURATIONS,
        JSON.stringify(storedUserConfigs)
      );
    }

    return response?.status === 201;
  } catch (error) {
    console.error("Error updating user configuration:", error);
    return false;
  }
};

/**
 * Update the entire app list for the user on the backend.
 * Posts the full array of app IDs as the APP_LIST_CONFIG_KEY value.
 */
export const UpdateUserAppList = async (
  appIds: string[],
  onLogout: () => Promise<void>
) => {
  try {
    const state = store.getState();
    const email = state.auth.email;
    if (!email) {
      console.error("No user email available to update app list");
      return false;
    }

    // The backend expects the request body to be a raw JSON array of app IDs.
    const response = await apiRequest(
      {
        url: `${BASE_URL}/users/${email}/apps`,
        method: "POST",
        data: appIds,
      },
      onLogout
    );

    if (response?.status === 201) {
      // persist locally
      const storedUserConfigsJson = await AsyncStorage.getItem(USER_CONFIGURATIONS);
      let storedUserConfigs: UserConfig[] = storedUserConfigsJson ? JSON.parse(storedUserConfigsJson) : [];

      // Update or add the app-list config
      const updatedUserConfigs = storedUserConfigs.length === 0
        ? [{ configKey: APP_LIST_CONFIG_KEY, configValue: appIds, email, isActive: 1 }]
        : storedUserConfigs.map((config) =>
            config.configKey === APP_LIST_CONFIG_KEY
              ? { ...config, configValue: appIds }
              : { ...config }
          );

      await AsyncStorage.setItem(USER_CONFIGURATIONS, JSON.stringify(updatedUserConfigs));
      return true;
    }

    console.warn("Failed to update user app list on server", response?.status);
    return false;
  } catch (error) {
    console.error("Error updating user app list:", error);
    return false;
  }
};
