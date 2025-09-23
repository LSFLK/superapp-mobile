import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { fetchMicroAppToken, MicroAppTokenParams } from "@/services/microAppTokenService";

/**
 * Bridge Registry - Central Hub for Native-Web Communication
 *
 * Architecture Flow:
 * 1. Web micro-app calls window.nativebridge.requestMethod(data)
 * 2. Message is posted to React Native via WebView.postMessage()
 * 3. Native app receives message and looks up handler in this registry
 * 4. Handler executes logic mentioned in the handler function
 * 5. Handler calls sendResponseToWeb() to send results back
 * 6. Web app receives response via custom DOM events
 *
 * Adding New Bridge Functions:
 * - Add entry to BRIDGE_REGISTRY array
 * - Define topic, handler function, and webViewMethods
 * - JavaScript injection is auto-generated from this registry
 */

export interface BridgeFunction {
  topic: string; // Unique identifier for the bridge function
  handler: (params: any, context: BridgeContext) => Promise<void> | void; // Native handler function
  webViewMethods: {
    request?: string; // Method name web apps call to initiate request
    resolve?: string; // Method name for success responses
    reject?: string; // Method name for error responses
    helper?: string; // Method name for data getters (creates global storage)
  };
}

export interface BridgeContext {
  empID: string; // Employee ID from authentication
  appID: string; // Micro-app identifier
  token: string | null; // Authentication token
  setScannerVisible: (visible: boolean) => void; // Control QR scanner visibility
  sendResponseToWeb: (method: string, data?: any) => void; // Send responses to web
  pendingTokenRequests: ((token: string) => void)[]; // Queue for token requests
}

// ADD NEW BRIDGE FUNCTIONS HERE
export const BRIDGE_REGISTRY: BridgeFunction[] = [

  {
    topic: "token",
    handler: async (params, context) => {
      if (context.token) {
        context.sendResponseToWeb("resolveToken", context.token);
        
        // Resolve any pending token requests
        while (context.pendingTokenRequests.length > 0) {
          const resolve = context.pendingTokenRequests.shift();
          resolve?.(context.token);
        }
      } else {
        context.pendingTokenRequests.push((token) => {
          context.sendResponseToWeb("resolveToken", token);
        });
      }
    },
    webViewMethods: {
      request: "requestToken",
      resolve: "resolveToken",
      helper: "getToken"
    }
  },


  {
    topic: "emp_id", 
    handler: async (params, context) => {
      context.sendResponseToWeb("resolveEmpId", context.empID);
    },
    webViewMethods: {
      request: "requestEmpId",
      resolve: "resolveEmpId", 
      reject: "regectEmpId",
    }
  },


  {
    topic: "qr_request",
    handler: async (params, context) => {
      context.setScannerVisible(true);
    },
    webViewMethods: {
      request: "requestQr"
    }
  },


  {
    topic: "alert",
    handler: async (params, context) => {
      const { title, message, buttonText } = params;
      Alert.alert(title, message, [{ text: buttonText }], { cancelable: false });
    },
    webViewMethods: {
      request: "requestAlert"
    }
  },

  /**
   * Confirm Alert Bridge - Shows native confirmation dialogs
   * 
   * Flow: Web app requests confirmation → Native shows Alert with buttons → 
   * User choice ("confirm" or "cancel") sent back to web app
   */
  {
    topic: "confirm_alert",
    handler: async (params, context) => {
      const { title, message, cancelButtonText, confirmButtonText } = params;
      Alert.alert(
        title,
        message,
        [
          {
            text: cancelButtonText,
            style: "cancel",
            onPress: () => context.sendResponseToWeb("resolveConfirmAlert", "cancel"),
          },
          {
            text: confirmButtonText,
            onPress: () => context.sendResponseToWeb("resolveConfirmAlert", "confirm"),
          },
        ],
        { cancelable: false }
      );
    },
    webViewMethods: {
      request: "requestConfirmAlert",
      resolve: "resolveConfirmAlert"
    }
  },

  /**
   * Local Storage Bridge - Saves data to AsyncStorage
   * 
   * Flow: Web app provides key/value → Native saves to AsyncStorage → 
   * Success/failure response sent back
   */
  {
    topic: "save_local_data",
    handler: async (params, context) => {
      try {
        const { key, value } = params;
        await AsyncStorage.setItem(key, value);
        context.sendResponseToWeb("resolveSaveLocalData");
      } catch (error) {
        const errMessage = error instanceof Error ? error.message : "Unknown error";
        context.sendResponseToWeb("rejectSaveLocalData", errMessage);
      }
    },
    webViewMethods: {
      request: "requestSaveLocalData",
      resolve: "resolveSaveLocalData",
      reject: "rejectSaveLocalData"
    }
  },

  /**
   * Local Storage Retrieval Bridge - Gets data from AsyncStorage
   * 
   * Flow: Web app provides key → Native retrieves from AsyncStorage → 
   * Value sent back (null if not found)
   */
  {
    topic: "get_local_data",
    handler: async (params, context) => {
      try {
        const { key } = params;
        const value = await AsyncStorage.getItem(key);
        context.sendResponseToWeb("resolveGetLocalData", { value });
      } catch (error) {
        const errMessage = error instanceof Error ? error.message : "Unknown error";
        context.sendResponseToWeb("rejectGetLocalData", errMessage);
      }
    },
    webViewMethods: {
      request: "requestGetLocalData",
      resolve: "resolveGetLocalData",
      reject: "rejectGetLocalData"
    }
  },

  /**
   * Micro-app Token Bridge - Fetches app-specific authentication tokens
   * 
   * Flow: Web app requests token → Native calls microAppTokenService → 
   * Token data (token, expiry, app_id) sent back or error reported
   */
  {
    topic: "microapp_token",
    handler: async (params, context) => {
      try {
        const { appID, empID } = context;
        // console.log("app id in context", appID);
        if (!appID) {
          throw new Error("app_id parameter is required");
        }

        if (!empID) {
          throw new Error("Employee ID is not available");
        }

        const tokenParams: MicroAppTokenParams = {
          emp_id: empID,
          app_id: appID
        };

        console.log(`Requesting microapp token for app: ${appID}, emp: ${empID}`);

        const tokenData = await fetchMicroAppToken(tokenParams);
        
        context.sendResponseToWeb("resolveMicroAppToken", {
          token: tokenData.token,
          expiresAt: tokenData.expiresAt,
          app_id: appID
        });
        
      } catch (error) {
        console.error("Error fetching microapp token:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        context.sendResponseToWeb("rejectMicroAppToken", errorMessage);
      }
    },
    webViewMethods: {
      request: "requestMicroAppToken",
      resolve: "resolveMicroAppToken",
      reject: "rejectMicroAppToken"
    }
  },

  // 🚀 EXAMPLE: Adding a new bridge function is as simple as adding it here
  // {
  //   topic: "get_device_info",
  //   handler: async (params, context) => {
  //     const deviceInfo = {
  //       platform: Platform.OS,
  //       version: Platform.Version,
  //     };
  //     context.sendResponseToWeb("resolveDeviceInfo", deviceInfo);
  //   },
  //   webViewMethods: {
  //     request: "requestDeviceInfo",
  //     resolve: "resolveDeviceInfo"
  //   }
  // },

  // 🚀 EXAMPLE: Bridge function with custom logic
  // {
  //   topic: "calculate_something",
  //   handler: async (params, context) => {
  //     const { a, b } = params;
  //     const result = a + b;
  //     context.sendResponseToWeb("resolveCalculation", { result });
  //   },
  //   webViewMethods: {
  //     request: "requestCalculation",
  //     resolve: "resolveCalculation"
  //   }
  // }
];

// Utility functions to work with the registry
/**
 * Get all available bridge topics
 */
export const getBridgeTopics = () => BRIDGE_REGISTRY.map(fn => fn.topic);

/**
 * Get handler function for a specific bridge topic
 */
export const getBridgeHandler = (topic: string) => 
  BRIDGE_REGISTRY.find(fn => fn.topic === topic)?.handler;

/**
 * Get complete bridge function definition for a topic
 */
export const getBridgeFunction = (topic: string) =>
  BRIDGE_REGISTRY.find(fn => fn.topic === topic);