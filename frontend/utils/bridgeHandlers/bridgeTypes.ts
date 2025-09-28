// Shared types for bridge handlers

export interface BridgeFunction {
  topic: string;
  handler: (params: any, context: any) => Promise<void> | void;
}

export interface BridgeContext {
  topic: string;
  userId: string;
  appID: string;
  token: string | null;
  setScannerVisible: (visible: boolean) => void;
  sendResponseToWeb: (method: string, data?: any, requestId?: string) => void;
  pendingTokenRequests: ((token: string) => void)[];
  resolve: (data?: any, requestId?: string) => void;
  reject: (error: string, requestId?: string) => void;
}
