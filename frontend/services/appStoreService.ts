import {
  deleteAsync,
  documentDirectory,
  downloadAsync,
  EncodingType,
  getInfoAsync,
  makeDirectoryAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from "expo-file-system";
import JSZip from "jszip";
import { fromByteArray } from "base64-js";
import { AppDispatch } from "@/context/store";
import {
  addDownloading,
  MicroApp,
  removeDownloading,
  setApps,
  updateAppStatus,
} from "@/context/slices/appSlice";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest } from "@/utils/requestHandler";
import {
  APPS,
  BASE_URL,
  DOWNLOADED,
  NOT_DOWNLOADED
} from "@/constants/Constants";
import { UpdateUserConfiguration } from "./userConfigService";

// File handle services
export const downloadMicroApp = async (
  dispatch: AppDispatch,
  appId: string,
  downloadUrl: string | null,
  onLogout: () => Promise<void>
) => {
  try {
    dispatch(addDownloading(appId)); // Downloading status for indicator

    if (!downloadUrl) {
      Alert.alert("Error", "Download URL is empty.");
      return;
    }

  await downloadAndSaveFile(appId, downloadUrl, onLogout); // Download react production build
    await unzipFile(dispatch, appId); // Unzip downloaded zip file
    // Skip user configuration update for now
    // await UpdateUserConfiguration(appId, DOWNLOADED, onLogout);
    console.log("Download completed for:", appId);
  } catch (error) {
    // Skip user configuration update for now
    // await UpdateUserConfiguration(appId, NOT_DOWNLOADED, onLogout);
    console.error("Download failed for:", appId, error);
    Alert.alert("Error", "Failed to download or save the file.");
  } finally {
    dispatch(removeDownloading(appId));
  }
};

const downloadAndSaveFile = async (
  appId: string,
  downloadUrl: string,
  onLogout: () => Promise<void>
) => {
  const fileName = `${appId}.zip`;
  const customDir = `${documentDirectory}wso2/micro-apps/`;

  if (!(await getInfoAsync(customDir)).exists) {
    await makeDirectoryAsync(customDir, { intermediates: true });
  }

  const fileUri = `${customDir}${fileName}`;

  // Use apiRequest (axios) to fetch binary data with authentication headers
  try {
    const response = await apiRequest(
      { url: downloadUrl, method: "GET", responseType: "arraybuffer" },
      onLogout
    );

    if (!response || !response.data) {
      throw new Error("Empty response when downloading micro app");
    }

    // response.data may be an ArrayBuffer or a Buffer-like object
    let uint8Array: Uint8Array;

    if (response.data instanceof ArrayBuffer) {
      uint8Array = new Uint8Array(response.data);
    } else if (ArrayBuffer.isView(response.data)) {
      // TypedArray or DataView
      // @ts-ignore
      uint8Array = new Uint8Array(response.data.buffer || response.data);
    } else if (response.data && typeof response.data === "object" && response.data.length) {
      // Fallback for Buffer in some environments
      // @ts-ignore
      uint8Array = new Uint8Array(response.data);
    } else {
      throw new Error("Unsupported response data type for micro app download");
    }

    // Convert bytes to base64 and write to file
    const base64String = fromByteArray(uint8Array);
    await writeAsStringAsync(fileUri, base64String, {
      encoding: EncodingType.Base64,
    });
  } catch (error) {
    console.error("Failed to download and save file:", error);
    throw error;
  }
};

const unzipFile = async (dispatch: AppDispatch, appId: string) => {
  try {
    const fileName = `${appId}.zip`;
    const customDir = `${documentDirectory}wso2/micro-apps/`;
    const fileUri = `${customDir}${fileName}`;
    const extractedDir = `${customDir}${appId}-extracted/`;

    const fileInfo = await getInfoAsync(fileUri);
    if (!fileInfo.exists || fileInfo.size === 0) {
      Alert.alert("Error", "ZIP file not found or is empty.");
      return;
    }

    const zipContent = await readAsStringAsync(fileUri, {
      encoding: EncodingType.Base64,
    });

    const zip = await JSZip.loadAsync(zipContent, { base64: true });

    await makeDirectoryAsync(extractedDir, { intermediates: true });

    await Promise.all(
      Object.keys(zip.files)
        .filter(
          (relativePath) =>
            !relativePath.startsWith("__MACOSX") &&
            !relativePath.includes("/._")
        )
        .map(async (relativePath) => {
          try {
            const entry = zip.files[relativePath];
            const targetPath = `${extractedDir}${relativePath}`;

            if (entry.dir) {
              await makeDirectoryAsync(targetPath, {
                intermediates: true,
              });
            } else {
              const fileData = await entry.async("base64");

              const folderPath = targetPath.substring(
                0,
                targetPath.lastIndexOf("/")
              );
              const folderExists = await getInfoAsync(folderPath);
              if (!folderExists.exists) {
                await makeDirectoryAsync(folderPath, {
                  intermediates: true,
                });
              }

              await writeAsStringAsync(targetPath, fileData, {
                encoding: EncodingType.Base64,
              });
            }
          } catch (err) {
            throw err;
          }
        })
    );

    const indexPath = await getIndexPath(extractedDir);
    if (!indexPath) {
      console.error("Index file not found in extracted directory:", extractedDir);
      throw new Error("Index file not found");
    }

    const clientId = await getClientId(extractedDir);
    if (!clientId) {
      console.error("Client ID not found, but continuing with default");
      // Don't throw error, just use default client ID
    }

    console.log("Unzip successful. Index path:", indexPath, "Client ID:", clientId);

    const formattedUri = encodeURI(
      indexPath.startsWith("file://") ? indexPath : `file://${indexPath}`
    );

    const relativeUri = formattedUri.replace(documentDirectory || "", "");

    dispatch(
      updateAppStatus({
        appId,
        status: DOWNLOADED,
        webViewUri: relativeUri,
        clientId: clientId || "default-microapp-client-id",
      })
    );
  } catch (error: any) {
    Alert.alert("Error", `Failed to unzip file: ${error.message || error}`);
    throw error;
  }
};

const getIndexPath = async (extractedDir: string) => {
  try {
    const possiblePaths = [
      `${extractedDir}index.html`,
      `${extractedDir}build/index.html`,
    ];

    for (const path of possiblePaths) {
      const fileInfo = await getInfoAsync(path);
      if (fileInfo.exists) {
        console.log("Found index.html at:", path);
        return path;
      }
    }

    console.error("index.html not found in any expected location");
    Alert.alert("Error", "index.html not found after unzipping.");
    return null;
  } catch (error) {
    console.error("Error reading indexPath:", error);
    return null;
  }
};

const getClientId = async (extractedDir: string) => {
  try {
    const possiblePaths = [
      `${extractedDir}microapp.json`,
      `${extractedDir}build/microapp.json`,
    ];

    for (const path of possiblePaths) {
      const fileInfo = await getInfoAsync(path);
      if (fileInfo.exists) {
        try {
          const jsonString = await readAsStringAsync(path);
          const appConfig = JSON.parse(jsonString);
          if (appConfig.clientId) return appConfig.clientId;
        } catch (jsonError) {
          console.error("Error parsing microapp.json:", jsonError);
          Alert.alert("Error", "Failed to parse microapp.json.");
          return null;
        }
      }
    }

    // If microapp.json is not found, return a default client ID
    console.log("microapp.json not found, using default client ID");
    return "default-microapp-client-id";
  } catch (error) {
    console.error("Error reading clientId:", error);
    return "default-microapp-client-id";
  }
};

export const removeMicroApp = async (
  dispatch: AppDispatch,
  appId: string,
  onLogout: () => Promise<void>
) => {
  try {
    const customDir = `${documentDirectory}wso2/micro-apps/`;
    await deleteAsync(`${customDir}/${appId}-extracted/`, {
      idempotent: true,
    });
    await deleteAsync(`${customDir}${appId}.zip`, {
      idempotent: true,
    });

    dispatch(
      updateAppStatus({
        appId,
        status: NOT_DOWNLOADED,
        webViewUri: "",
        clientId: "",
        exchangedToken: "",
      })
    );
    // Skip user configuration update for now
    // await UpdateUserConfiguration(appId, NOT_DOWNLOADED, onLogout);
    console.log("App removed:", appId);
  } catch (error) {
    console.error("Failed to remove app:", appId, error);
    Alert.alert("Error", "Failed to remove the app.");
  }
};

// API services
// Load app list and if updates available update apps
export const loadMicroAppDetails = async (
  dispatch: AppDispatch,
  onLogout: () => Promise<void>
) => {
  try {
    // Load stored apps from AsyncStorage
    const storedAppsJson = await AsyncStorage.getItem(APPS);
    const storedApps: MicroApp[] = storedAppsJson
      ? JSON.parse(storedAppsJson)
      : [];

    // Dispatch stored apps initially
    // If no stored apps and we're in development, inject a mock app so
 
    dispatch(setApps(storedApps));

    // Fetch latest micro apps list from API
    const response = await apiRequest(
      { url: `${BASE_URL}/micro-apps`, method: "GET" },
      onLogout
    );

    if (response?.data) {
      // Update apps list with status and webViewUri
      let apps: MicroApp[] = response.data.map((app: MicroApp) => {
        const storedApp = storedApps.find(
          (stored) => stored.app_id === app.app_id
        );
        if (storedApp && storedApp.version) {
          // If new version available automatically update
          if (app.version !== storedApp.version) {
            downloadMicroApp(
              dispatch,
              app.app_id,
              app.download_url,
              onLogout
            );
          }

          return {
            ...app,
            status: storedApp?.status,
            webViewUri: storedApp?.webViewUri || "",
            clientId: storedApp?.clientId || "",
            exchangedToken: storedApp?.exchangedToken || "",
          };
        }
        return app;
      });

      // Update Redux and AsyncStorage
      dispatch(setApps(apps));
      await AsyncStorage.setItem(APPS, JSON.stringify(apps));
    }
  } catch (error) {
    console.error("Error loading micro apps:", error);
    // dispatch(setApps([]));
    // Don't clear apps on error, just log it
  }
};
