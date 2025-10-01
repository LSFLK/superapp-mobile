import { BridgeFunction } from "./bridgeTypes";
import { fetchMicroAppToken, MicroAppTokenParams } from "@/services/microAppTokenService";

export const BRIDGE_FUNCTION: BridgeFunction = {
  topic: "micro_app_token",
  handler: async (params, context) => {
    try {
      const { appID, userId } = context;
      if (!appID) {
        throw new Error("app_id parameter is required");
      }

      if (!userId) {
        throw new Error("User ID is not available");
      }

      const tokenParams: MicroAppTokenParams = {
        user_id: userId,
        app_id: appID
      };

      const tokenData = await fetchMicroAppToken(tokenParams);
      
      context.resolve({
        token: tokenData.token,
        expiresAt: tokenData.expiresAt,
        app_id: appID
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      context.reject(errorMessage);
    }
  }
};
