import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { fetchMicroAppToken, MicroAppTokenParams } from "@/services/microAppTokenService";

/**
 * SINGLE PLACE TO ADD/MODIFY BRIDGE FUNCTIONS
 * 
 * This registry defines all bridge functions in one place.
 * To add a new bridge function:
 * 1. Add it to this registry
 * 2. That's it! Everything else is auto-generated.
 */

export interface BridgeFunction {
  topic: string;
  handler: (params: any, context: BridgeContext) => Promise<void> | void;
  webViewMethods: {
    request?: string;
    resolve?: string;
    reject?: string;
    helper?: string;
  };
}

export interface BridgeContext {
  empID: string;
  appID: string;
  token: string | null;
  setScannerVisible: (visible: boolean) => void;
  sendResponseToWeb: (method: string, data?: any) => void;
  pendingTokenRequests: ((token: string) => void)[];
}

// 🎯 THE ONLY PLACE DEVS NEED TO MODIFY TO ADD BRIDGE FUNCTIONS
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
      helper: "getEmpId"
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
export const getBridgeTopics = () => BRIDGE_REGISTRY.map(fn => fn.topic);

export const getBridgeHandler = (topic: string) => 
  BRIDGE_REGISTRY.find(fn => fn.topic === topic)?.handler;

export const getBridgeFunction = (topic: string) =>
  BRIDGE_REGISTRY.find(fn => fn.topic === topic);