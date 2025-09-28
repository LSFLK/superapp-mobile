import { BridgeFunction } from "./bridgeTypes";
import { Alert } from "react-native";

export const BRIDGE_FUNCTION: BridgeFunction = {
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
};
