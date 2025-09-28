import { BridgeFunction } from "./bridgeTypes";
import { Alert } from "react-native";

export const BRIDGE_FUNCTION: BridgeFunction = {
  topic: "alert",
  handler: async (params, context) => {
    const { title, message, buttonText } = params;
    Alert.alert(title, message, [{ text: buttonText }], { cancelable: false });
  }
};
