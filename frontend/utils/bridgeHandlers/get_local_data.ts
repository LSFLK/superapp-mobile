import { BridgeFunction } from "./bridgeTypes";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const BRIDGE_FUNCTION: BridgeFunction = {
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
};
