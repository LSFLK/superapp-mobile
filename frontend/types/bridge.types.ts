// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

// Global window extensions
declare global {
  interface Window {
    nativeToken: string | null;
    // nativeEmpId: string | null;
    nativebridge: NativeBridge;
    ReactNativeWebView: {
      postMessage(message: string): void;
    };
    // Dynamic global variables are created at runtime for bridge functions with helpers
    // Pattern: native + PascalCase(topic) = global variable name
    // Example: topic "user_settings" → window.nativeUserSettings
    [key: `native${string}`]: any;
  }
}

// Auto-generated bridge interface
export interface NativeBridge {
  // Token methods
  requestToken: () => void;
  resolveToken: (token: string) => void;
  getToken: () => string | null;

  // Employee ID methods  
  // requestEmpId: () => void;
  // resolveEmpId: (empId: string) => void;
  // getEmpId: () => string | null;

  // QR Scanner methods
  requestQr: () => void;

  // Alert methods
  requestAlert: (title: string, message: string, buttonText: string) => void;

  // Confirm Alert methods
  requestConfirmAlert: (title: string, message: string, confirmButtonText: string, cancelButtonText: string) => void;
  resolveConfirmAlert: (result: "confirm" | "cancel") => void;

  // Local Storage methods
  requestSaveLocalData: (key: string, value: string) => void;
  resolveSaveLocalData: () => void;
  rejectSaveLocalData: (error: string) => void;

  requestGetLocalData: (key: string) => void;
  resolveGetLocalData: (data: { value: string | null }) => void;
  rejectGetLocalData: (error: string) => void;

  // When you add new bridge functions to bridgeRegistry.ts, add their type signatures here
  // Example:
  // requestUserSettings: () => void;
  // resolveUserSettings: (settings: any) => void;
  // getUserSettings: () => any;
}

// Event types for bridge communication
export interface BridgeEvents {
  // Core events that are always available
  nativeTokenReceived: CustomEvent<string>;
  // nativeEmpIdReceived: CustomEvent<string>;
  resolveConfirmAlert: CustomEvent<"confirm" | "cancel">;
  resolveSaveLocalData: CustomEvent<void>;
  rejectSaveLocalData: CustomEvent<string>;
  resolveGetLocalData: CustomEvent<{ value: string | null }>;
  rejectGetLocalData: CustomEvent<string>;
  
  // Dynamic events are created at runtime following these patterns:
  // 1. resolve/reject events: exactly match the webViewMethods.resolve/reject names
  // 2. "received" events: native + PascalCase(topic) + "Received"
  //    Example: topic "user_settings" → "nativeUserSettingsReceived"
  
  // Generic event signatures for dynamically generated events
  [eventName: `resolve${string}`]: CustomEvent<any>;
  [eventName: `reject${string}`]: CustomEvent<string>;
  [eventName: `native${string}Received`]: CustomEvent<any>;
}

// Utility types for microapp developers
export type BridgeEventName = keyof BridgeEvents;
export type BridgeEventData<T extends BridgeEventName> = BridgeEvents[T]["detail"];

// Helper function types for microapp usage
export interface BridgeHelpers {
  /**
   * Get the current authentication token
   * @returns The current token or null if not available
   */
  getToken(): string | null;

  /**
   * Get the current employee ID
   * @returns The current employee ID or null if not available
   */
  // getEmpId(): string | null;

  /**
   * Request authentication token from native app
   */
  requestToken(): void;

  /**
   * Request employee ID from native app
   */
  // requestEmpId(): void;

  /**
   * Show a native alert dialog
   * @param title Alert title
   * @param message Alert message
   * @param buttonText Button text
   */
  showAlert(title: string, message: string, buttonText?: string): void;

  /**
   * Show a native confirmation dialog
   * @param title Dialog title
   * @param message Dialog message
   * @param confirmText Confirm button text
   * @param cancelText Cancel button text
   * @returns Promise that resolves to user's choice
   */
  showConfirm(title: string, message: string, confirmText?: string, cancelText?: string): Promise<boolean>;

  /**
   * Save data to device storage
   * @param key Storage key
   * @param value Value to store
   * @returns Promise that resolves when data is saved
   */
  saveData(key: string, value: string): Promise<void>;

  /**
   * Get data from device storage
   * @param key Storage key
   * @returns Promise that resolves to the stored value
   */
  getData(key: string): Promise<string | null>;

  /**
   * Request QR code scanning
   * Listen for 'qrCodeScanned' event for the result
   */
  requestQrScan(): void;
}

export default NativeBridge;