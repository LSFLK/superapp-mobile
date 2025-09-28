import { BridgeFunction } from "./bridgeTypes";

export const BRIDGE_FUNCTION: BridgeFunction = {
  topic: "token",
  handler: async (params, context) => {
    if (context.token) {
      context.resolve(context.token);
      
      // Resolve any pending token requests
      while (context.pendingTokenRequests.length > 0) {
        const resolve = context.pendingTokenRequests.shift();
        resolve?.(context.token as string);
      }
    } else {
      context.pendingTokenRequests.push((token: string) => {
        context.resolve(token);
      });
    }
  }
};
