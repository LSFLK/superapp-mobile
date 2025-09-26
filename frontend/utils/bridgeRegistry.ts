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
 * 6. Web app receives response via promise resolution/rejection
 *
 * Adding New Bridge Functions:
 * - Add entry to BRIDGE_REGISTRY array with topic and handler function
 * - Method names are auto-generated from topic (requestTopic, resolveTopic, etc.)
 * - JavaScript injection is auto-generated from this registry
 */

export interface BridgeFunction {
  topic: string; // Unique identifier for the bridge function
  handler: (params: any, context: BridgeContext) => Promise<void> | void; // Native handler function
  // Method names are auto-generated from topic:
  // - request: `request${capitalize(topic)}`
  // - resolve: `resolve${capitalize(topic)}`
  // - reject: `reject${capitalize(topic)}`
  // - helper: `get${capitalize(topic)}`
}

export interface BridgeContext {
  topic: string; // Current bridge topic (auto-injected)
  userId: string; // User ID from authentication
  appID: string; // Micro-app identifier
  token: string | null; // Authentication token
  setScannerVisible: (visible: boolean) => void; // Control QR scanner visibility
  sendResponseToWeb: (method: string, data?: any, requestId?: string) => void; // Send responses to web
  pendingTokenRequests: ((token: string) => void)[]; // Queue for token requests
  // Convenience methods that use the current topic
  resolve: (data?: any, requestId?: string) => void; // Auto-generates resolve method name
  reject: (error: string, requestId?: string) => void; // Auto-generates reject method name
}

// ADD NEW BRIDGE FUNCTIONS HERE
export const BRIDGE_REGISTRY: BridgeFunction[] = [

  {
    topic: "token",
    handler: async (params, context) => {
      if (context.token) {
        context.resolve(context.token);
        
        // Resolve any pending token requests
        while (context.pendingTokenRequests.length > 0) {
          const resolve = context.pendingTokenRequests.shift();
          resolve?.(context.token);
        }
      } else {
        context.pendingTokenRequests.push((token) => {
          context.resolve(token);
        });
      }
    }
  },


  {
    topic: "user_id", 
    handler: async (params, context) => {
      context.resolve(context.userId);
    }
  },


  {
    topic: "qr_request",
    handler: async (params, context) => {
      context.setScannerVisible(true);
    }
  },


  {
    topic: "alert",
    handler: async (params, context) => {
      const { title, message, buttonText } = params;
      Alert.alert(title, message, [{ text: buttonText }], { cancelable: false });
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
            onPress: () => context.resolve("cancel"),
          },
          {
            text: confirmButtonText,
            onPress: () => context.resolve("confirm"),
          },
        ],
        { cancelable: false }
      );
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
        context.resolve();
      } catch (error) {
        const errMessage = error instanceof Error ? error.message : "Unknown error";
        context.reject(errMessage);
      }
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
        context.resolve({ value });
      } catch (error) {
        const errMessage = error instanceof Error ? error.message : "Unknown error";
        context.reject(errMessage);
      }
    }
  },

  /**
   * Micro-app Token Bridge - Fetches app-specific authentication tokens
   * 
   * Flow: Web app requests token → Native calls microAppTokenService → 
   * Token data (token, expiry, app_id) sent back or error reported
   */
  {
    topic: "micro_app_token",
    handler: async (params, context) => {
      try {
        const { appID, userId } = context;
        // console.log("app id in context", appID);
        if (!appID) {
          throw new Error("app_id parameter is required");
        }

        if (!userId) {
          throw new Error("User ID is not available");
        }

        const tokenParams: MicroAppTokenParams = {
          emp_id: userId,
          app_id: appID
        };

        console.log(`Requesting microapp token for app: ${appID}, user: ${userId}`);

        const tokenData = await fetchMicroAppToken(tokenParams);
        
        context.resolve({
          token: tokenData.token,
          expiresAt: tokenData.expiresAt,
          app_id: appID
        });
        
      } catch (error) {
        console.error("Error fetching microapp token:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        context.reject(errorMessage);
      }
    }
  },

  // 🚀 EXAMPLE: Adding a new bridge function is as simple as adding it here
  // Method names are auto-generated from topic - no need to specify them!
  // {
  //   topic: "get_device_info",
  //   handler: async (params, context) => {
  //     const deviceInfo = {
  //       platform: Platform.OS,
  //       version: Platform.Version,
  //     };
  //     context.resolve(deviceInfo); // Auto-generates resolveGetDeviceInfo
  //   }
  // },

  // 🚀 EXAMPLE: Bridge function with error handling
  // {
  //   topic: "calculate_something",
  //   handler: async (params, context) => {
  //     try {
  //       const { a, b } = params;
  //       const result = a + b;
  //       context.resolve({ result }); // Auto-generates resolveCalculateSomething
  //     } catch (error) {
  //       context.reject("Calculation failed"); // Auto-generates rejectCalculateSomething
  //     }
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

/**
 * Helper function to capitalize topic names for method generation
 */
const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Auto-generated method name helpers
 */
export const getRequestMethod = (topic: string): string => `request${capitalize(topic)}`;
export const getResolveMethod = (topic: string): string => `resolve${capitalize(topic)}`;
export const getRejectMethod = (topic: string): string => `reject${capitalize(topic)}`;
export const getHelperMethod = (topic: string): string => `get${capitalize(topic)}`;
