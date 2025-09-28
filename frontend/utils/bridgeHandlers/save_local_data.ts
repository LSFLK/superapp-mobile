import { BridgeFunction } from "./bridgeTypes";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const BRIDGE_FUNCTION: BridgeFunction = {
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
};
