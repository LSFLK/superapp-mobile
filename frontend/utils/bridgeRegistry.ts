// registry now imports modular handlers from ./bridgeHandlers
import { BRIDGE_REGISTRY as MODULAR_BRIDGE_REGISTRY } from "./bridgeHandlers";

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
export const BRIDGE_REGISTRY: BridgeFunction[] = MODULAR_BRIDGE_REGISTRY;


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
