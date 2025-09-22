import { createAsyncThunk } from "@reduxjs/toolkit";
import { store } from "@/context/store";
import { DOWNLOADED } from "@/constants/Constants";
import { downloadMicroApp, removeMicroApp } from "@/services/appStoreService";
import { UpdateUserConfiguration } from "./userConfigService";
import { Alert } from "react-native";

/**
 * Thunk to synchronize apps based on downloaded-apps list present in detailed user info.
 *
 * Behavior:
 * - Reads detailed user info from the store and expects an array of app IDs
 *   (defensive: checks multiple likely field names).
 * - Compares with locally downloaded apps and prompts the user before performing
 *   mass installs/removals.
 *
 * The thunk payload: { onLogout: () => Promise<void> }
 */
export const syncAppsFromUserInfo = createAsyncThunk(
  "apps/syncFromUserInfo",
  async (
    params: { onLogout: () => Promise<void> },
    { getState, dispatch }
  ) => {
    try {
  // Read current state
  // cast to any for convenience in this service thunk
  const state: any = getState();

  const userInfo = state.userInfo && state.userInfo.userInfo;
      if (!userInfo) {
        console.log("No detailed user info available to sync apps");
        return;
      }

      const possibleFields = [
        "downloadedApps"
      ];

      let allowedApps: string[] = [];
      for (const field of possibleFields) {
        // @ts-ignore
        const val = userInfo[field];
        if (Array.isArray(val)) {
          allowedApps = val.map(String);
          break;
        }
      }

      if (!allowedApps || allowedApps.length === 0) {
        console.log("User detailed info does not contain an apps list to sync");
        return;
      }

  const localApps = (state.apps && state.apps.apps) || [];
      const localAppIds = localApps.filter((a: any) => a?.status === DOWNLOADED).map((a: any) => a.app_id);

      const appsToRemove = localAppIds.filter((id: string) => !allowedApps.includes(id));
      const appsToInstall = allowedApps.filter((id: string) => !localAppIds.includes(id));

      console.log("App sync plan - install:", appsToInstall, "remove:", appsToRemove);

      // If there are multiple installs/removals, ask user for confirmation before bulk changes
      if ((appsToInstall.length + appsToRemove.length) > 0) {
        const userConfirmed = await new Promise<boolean>((resolve) => {
          Alert.alert(
            "Sync apps",
            `Found ${appsToInstall.length} apps to install and ${appsToRemove.length} to remove. Proceed?`,
            [
              { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
              { text: "Proceed", onPress: () => resolve(true) },
            ],
            { cancelable: true }
          );
        });

        if (!userConfirmed) {
          console.log("User cancelled app sync");
          return;
        }
      }

      // Perform removals first
      for (const appId of appsToRemove) {
        try {
          await removeMicroApp(dispatch as any, appId, params.onLogout);
          // Optionally update server-side list — commented out for now
          // await UpdateUserConfiguration(appId, "not-downloaded", params.onLogout);
        } catch (err) {
          console.error(`Failed to remove app during sync: ${appId}`, err);
        }
      }

      // Install apps the user has but are not downloaded locally
      const allApps = localApps; // server-provided app metadata typically lives here
      for (const appId of appsToInstall) {
        const appMeta = allApps.find((a: any) => a.app_id === appId);
        if (!appMeta) {
          console.warn(`App metadata not found for ${appId}, skipping install`);
          continue;
        }

        try {
          await downloadMicroApp(dispatch as any, appId, appMeta.download_url, params.onLogout);
          // Optionally update server-side list — commented out for now
          // await UpdateUserConfiguration(appId, "downloaded", params.onLogout);
        } catch (err) {
          console.error(`Failed to download app during sync: ${appId}`, err);
        }
      }

      console.log("App sync from user info complete");
    } catch (error) {
      console.error("Error syncing apps from user info:", error);
    }
  }
);

