import { BridgeFunction } from "./bridgeTypes";

export const BRIDGE_FUNCTION: BridgeFunction = {
  topic: "user_id",
  handler: async (params, context) => {
    context.resolve(context.userId);
  }
};
