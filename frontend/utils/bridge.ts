<<<<<<< HEAD
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

=======
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
// Bridge event topics used for communication between the main app and micro apps.
export const TOPIC = {
  TOKEN: "token",
  EMP_ID: "emp_id",
  QR_REQUEST: "qr_request",
  SAVE_LOCAL_DATA: "save_local_data",
  GET_LOCAL_DATA: "get_local_data",
  ALERT: "alert",
  CONFIRM_ALERT: "confirm_alert",
  TOTP: "totp",
  GOOGLE_LOGIN: "google_login",
  UPLOAD_TO_GOOGLE_DRIVE: "upload_to_google_drive",
  RESTORE_GOOGLE_DRIVE_BACKUP: "restore_google_drive_backup",
  GOOGLE_USER_INFO: "google_user_info",
  CHECK_GOOGLE_AUTH_STATE: "check_google_auth_state",
};

// JavaScript code injected into the WebView to enable communication between
// the micro app and the React Native app via the native bridge.
export const injectedJavaScript = `
  // Initialize global variables
  window.nativeToken = null;
  window.nativeEmpId = null;
  
  window.nativebridge = {
    requestToken: () => {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        topic: 'token'
      }));
    },
    resolveToken: (token) => {
      // Store token globally for microapp access
      window.nativeToken = token;
      console.log("Token received from native app:", token);
      
      // Dispatch custom event for microapp to listen to
      window.dispatchEvent(new CustomEvent('nativeTokenReceived', { detail: token }));
    },
    requestEmpId: () => {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        topic: 'emp_id'
      }));
    },
    resolveEmpId: (empId) => {
      // Store empID globally for microapp access
      window.nativeEmpId = empId;
      console.log("Employee ID received from native app:", empId);
      
      // Dispatch custom event for microapp to listen to
      window.dispatchEvent(new CustomEvent('nativeEmpIdReceived', { detail: empId }));
    },
    // Helper function for microapps to get empID
    getEmpId: () => {
      return window.nativeEmpId;
    },
    // Helper function for microapps to get token
    getToken: () => {
      return window.nativeToken;
    },
    requestQr: () => {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        topic: 'qr_request'
      }));
    },
    requestAlert: (title, message, buttonText) => {
      window.ReactNativeWebView.postMessage(JSON.stringify({ 
        topic: "alert", 
        data: { title, message, buttonText } 
      }));
    },
    requestConfirmAlert: (title, message, confirmButtonText, cancelButtonText) => {
      window.ReactNativeWebView.postMessage(JSON.stringify({ 
        topic: "confirm_alert", 
        data: { title, message, confirmButtonText, cancelButtonText } 
      }));
    },
    requestSaveLocalData: (key, value) => window.ReactNativeWebView.postMessage(JSON.stringify({ topic: "save_local_data", data: { key, value } })),
    resolveSaveLocalData: () => console.log("Local data saved successfully"),
    rejectSaveLocalData: (err) => console.error("Save Local Data failed:", err),
    requestGetLocalData: (key) => window.ReactNativeWebView.postMessage(JSON.stringify({ topic: "get_local_data", data: { key } })),
    resolveGetLocalData: (data) => console.log("Local data received:", data),
    rejectGetLocalData: (err) => console.error("Get Local Data failed:", err),
    requestTotpQrMigrationData: () => window.ReactNativeWebView.postMessage(JSON.stringify({ topic: "totp" })),
    resolveTotpQrMigrationData: (data) => console.log("TOTP QR Migration Data:", data),
    rejectTotpQrMigrationData: (err) => console.error("TOTP Data retrieval failed:", err),
    requestGoogleLogin: () => window.ReactNativeWebView.postMessage(JSON.stringify({ topic: "google_login" })),
    resolveGoogleLogin: (data) => console.log("Google login data received:", data),
    rejectGoogleLogin: (err) => console.error("Google login failed:", err),
    requestUploadToGoogleDrive: (data) => window.ReactNativeWebView.postMessage(JSON.stringify({ topic: "upload_to_google_drive", data })),
    resolveUploadToGoogleDrive: () => console.log("Google Drive upload successful"),
    rejectUploadToGoogleDrive: (err) => console.error("Google Drive upload failed:", err),
    requestRestoreGoogleDriveBackup: () => window.ReactNativeWebView.postMessage(JSON.stringify({ topic: "restore_google_drive_backup" })),
    resolveRestoreGoogleDriveBackup: (data) => console.log("Google Drive backup restored:", data),
    rejectRestoreGoogleDriveBackup: (err) => console.error("Google Drive restore failed:", err),
    requestGoogleAuthState: () => window.ReactNativeWebView.postMessage(JSON.stringify({ topic: "check_google_auth_state" })),
    resolveGoogleAuthState: (data) => console.log("Google Auth State:", data),
    rejectGoogleAuthState: (err) => console.error("Google Auth State check failed:", err),
    requestGoogleUserInfo: () => window.ReactNativeWebView.postMessage(JSON.stringify({ topic: "google_user_info" })),
    resolveGoogleUserInfo: (data) => console.log("Google User Info:", data),
    rejectGoogleUserInfo: (err) => console.error("Google User Info retrieval failed:", err)
  };`;
