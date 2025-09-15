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
