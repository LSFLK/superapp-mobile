import { BridgeFunction } from "./bridgeTypes";

export const BRIDGE_FUNCTION: BridgeFunction = {
  topic: "qr_request",
  handler: async (params, context) => {
    context.setScannerVisible(true);
  }
};
