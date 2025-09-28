import { BridgeFunction, BridgeContext } from './bridgeTypes';

export const BRIDGE_FUNCTION: BridgeFunction = {
  topic: 'example_topic',
  handler: async (params: any, context: BridgeContext) => {
    try {
      if (!params) {
        context.reject('Missing parameters');
        return;
      }

      // Example logic (replace with real work)
      const result = { hello: 'world', received: params };

      context.resolve(result);
    } catch (err) {
      context.reject(err instanceof Error ? err.message : String(err));
    }
  }
};
