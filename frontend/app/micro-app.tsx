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
import {
  View,
  Alert,
  Text,
  TouchableOpacity,
  useColorScheme,
  StyleSheet,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { Stack, useLocalSearchParams } from "expo-router";
import NotFound from "@/components/NotFound";
//import Scanner from "@/components/Scanner";
import { useDispatch } from "react-redux";
import { getBridgeHandler, BridgeContext } from "@/utils/bridgeRegistry";
import { injectedJavaScript } from "@/utils/bridge";
//import { logout, tokenExchange } from "@/services/authService";
import { documentDirectory } from "expo-file-system";
import { MicroAppParams } from "@/types/navigation";
import { Colors } from "@/constants/Colors";
import {
  DEVELOPER_APP_DEFAULT_URL,
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_SCOPES,
  GOOGLE_WEB_CLIENT_ID,
  isIos,
} from "@/constants/Constants";
import prompt from "react-native-prompt-android";
import * as WebBrowser from "expo-web-browser";
/* import googleAuthenticationService, {
  getGoogleUserInfo,
  isAuthenticatedWithGoogle,
  restoreGoogleDriveBackup,
  uploadToGoogleDrive,
} from "@/services/googleService"; */
import * as Google from "expo-auth-session/providers/google";

WebBrowser.maybeCompleteAuthSession();

/**
 * MicroApp Component
 *
 * Renders a WebView for individual micro-applications within the super app.
 * Handles bidirectional communication between the native app and web micro-apps
 * through a bridge system, manages authentication tokens, and provides error recovery.
 *
 */
const MicroApp = () => {
  const [isScannerVisible, setScannerVisible] = useState(false);
  const { webViewUri, appName, appId, empID } = useLocalSearchParams<MicroAppParams>();
  const [hasError, setHasError] = useState(false);
  const webviewRef = useRef<WebView>(null);
  const [token, setToken] = useState<string | null>();
  const dispatch = useDispatch();
  const pendingTokenRequests: ((token: string) => void)[] = [];
  const [webUri, setWebUri] = useState<string>(DEVELOPER_APP_DEFAULT_URL);
  const colorScheme = useColorScheme();
  const styles = createStyles(colorScheme ?? "light");
  // Developer mode flag (temporarily disabled)
  const isDeveloper: boolean = false; // Temporarily disable developer mode
  // const isTotp: boolean = appId.includes("totp");

  // const [request, response, promptAsync] = Google.useAuthRequest({
  //   iosClientId: GOOGLE_IOS_CLIENT_ID,
  //   webClientId: GOOGLE_WEB_CLIENT_ID,
  //   androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  //   scopes: GOOGLE_SCOPES,
  // });


  /* Handle Google authentication response
  useEffect(() => {
    if (response) {
      googleAuthenticationService(response)
        .then((res) => {
          if (res.status) {
            sendResponseToWeb("resolveGoogleLogin", res.userInfo);
          } else {
            sendResponseToWeb("rejectGoogleLogin", res.error);
          }
        })
        .catch((err) => {
          console.error("Google authentication error:", err);
          sendResponseToWeb("rejectGoogleLogin", err.message);
        });
    }
  }, [response]);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const token = await tokenExchange(
          dispatch,
          clientId,
          exchangedToken,
          appId,
          logout
        );
        if (!token) throw new Error("Token exchange failed");
        setToken(token);
        sendTokenToWebView(token);
      } catch (error) {
        console.error("Token exchange error:", error);
      }
    };

    fetchToken();
  }, [clientId]);*/




  /**
   * Main message handler for communication from web micro-apps
   * 
   * Flow:
   * 1. Parses incoming JSON message with topic and data
   * 2. Looks up the appropriate handler in the bridge registry
   * 3. Creates a bridge context with app-specific data
   * 4. Executes the handler to process the request
   */
  const onMessage = async (event: WebViewMessageEvent) => {
    try {
      const { topic, data, requestId } = JSON.parse(event.nativeEvent.data);
      if (!topic) throw new Error("Invalid message format: Missing topic");

      // Get handler from registry
      const handler = getBridgeHandler(topic);
      if (!handler) {
        console.error("Unknown topic:", topic);
        return;
      }
      // Create bridge context for passing data
      const bridgeContext: BridgeContext = {
        empID,
        appID: appId as string,
        token: token || null,
        setScannerVisible,
  //    * Sends responses from native code back to the web micro-app
  //    * through the injected bridge JavaScript interface.
        sendResponseToWeb: (method: string, data?: any, reqId?: string) => {
          const idToUse = reqId || requestId;
          webviewRef.current?.injectJavaScript(
            `window.nativebridge.${method}(${JSON.stringify(data)}, "${idToUse}");`
          );
        },
        pendingTokenRequests
      };

      // Execute handler
      await handler(data, bridgeContext);
    } catch (error) {
      console.error("Error handling WebView message:", error);
    }
  };

  /**
   * Handles WebView loading errors by setting error state
   */
  const handleError = (syntheticEvent: any) => {
    setHasError(true);
    console.error("WebView error:", syntheticEvent.nativeEvent);
  };

  /**
   * Resets error state and reloads the WebView
   */
  const reloadWebView = () => {
    setHasError(false);
    webviewRef.current?.reload();
  };

  /**
   * Renders the WebView component with appropriate configuration
   * 
   * Flow:
   * 1. Validates that a URI is provided
   * 2. Determines if it's a URL-based or file-based micro-app (for developer mode)
   * 3. Configures WebView with appropriate permissions and settings
   * 4. Shows error UI if loading failed, otherwise renders WebView
   */
  const renderWebView = (webViewUri: string) => {
    // webViewUri = "http://10.100.5.83:5173/";
    // Check if web view uri is available
    if (!webViewUri) {
      Alert.alert("Error", "Microapp URL not found. Please check the configuration.");
      return <NotFound />;
    }

    // Determine if this is a URL-based microapp (for testing) or file-based
    const isUrlBased = webViewUri.startsWith('http://') || webViewUri.startsWith('https://');
    const sourceUri = isUrlBased
      ? webViewUri
      : isDeveloper
        ? webViewUri
        : `${documentDirectory}${webViewUri}`;

    return (
      <View style={{ flex: 1 }}>
        {hasError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Failed to load the microapp</Text>
            <Text style={styles.errorMessage}>
              {isUrlBased
                ? `Please check if the microapp is available at: ${webViewUri}`
                : isDeveloper
                  ? `Please check if your development server is running on ${webViewUri}`
                  : "We encountered an issue while loading the app. Please try again later."
              }
            </Text>
            <TouchableOpacity
              onPress={reloadWebView}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <WebView
            ref={webviewRef}
            originWhitelist={["*"]}
            source={{ uri: sourceUri }}
            allowFileAccess={!isUrlBased} // Only allow file access for local apps
            allowUniversalAccessFromFileURLs={false}
            allowingReadAccessToURL={isUrlBased ? undefined : "file:///"}
            style={{ flex: 1 }}
            onMessage={onMessage}
            onError={handleError}
            onShouldStartLoadWithRequest={() => true}
            domStorageEnabled
            webviewDebuggingEnabled={isDeveloper || isUrlBased}
            injectedJavaScriptBeforeContentLoaded={injectedJavaScript}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading {appName}...</Text>
              </View>
            )}
          />
        )}
      </View>
    );
  };

  /**
   * Main render method
   */
  return (
    <>
      <Stack.Screen
        options={{
          title: appName,
          headerRight: () =>
            isDeveloper && (
              <TouchableOpacity
                onPressIn={() => {
                  isIos
                    ? Alert.prompt(
                      "App URL",
                      "Enter App URL",
                      [
                        {
                          text: "Cancel",
                          style: "cancel",
                        },
                        {
                          text: "OK",
                          onPress: (value) => {
                            if (value) {
                              setWebUri(value);
                            }
                          },
                        },
                      ],
                      "plain-text",
                      webUri
                    )
                    : prompt(
                      "App URL",
                      "Enter App URL",
                      [
                        {
                          text: "Cancel",
                          onPress: () => console.log("Cancel Pressed"),
                          style: "cancel",
                        },
                        {
                          text: "OK",
                          onPress: (value) => {
                            if (value) {
                              setWebUri(value);
                            }
                          },
                          style: "default",
                        },
                      ],
                      {
                        type: "plain-text",
                        cancelable: false,
                        defaultValue: webUri,
                      }
                    );
                }}
                hitSlop={20}
              >
                <Text style={styles.headerText}>App URL</Text>
              </TouchableOpacity>
            ),
        }}
      />
      <View style={styles.container}>
        {/* {isScannerVisible && (
          <View style={styles.scannerOverlay}>
            <Scanner
              onScan={(qrCode) => {
                sendQrToWebView(qrCode);
                setScannerVisible(false);
              }}
              message={
                isTotp
                  ? "We need access to your camera to scan QR codes for generating one-time passwords (TOTP) for secure authentication. This will allow you to easily log in to your accounts."
                  : undefined
              }
            />
          </View>
        )} */}

        <View
          style={[
            styles.webViewContainer,
            isScannerVisible && styles.webViewHidden,
          ]}
        >
          {renderWebView(isDeveloper ? webUri : webViewUri)}
        </View>
      </View>
    </>
  );
};

export default MicroApp;

const createStyles = (colorScheme: "light" | "dark") =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    scannerOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    webViewContainer: {
      flex: 1,
      opacity: 1,
      pointerEvents: "auto",
    },
    webViewHidden: {
      opacity: 0,
      pointerEvents: "none",
    },
    headerText: {
      fontWeight: "600",
      color: Colors[colorScheme].primaryTextColor,
    },
    errorContainer: {
      flex: 1,
      padding: 24,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: Colors[colorScheme].primaryBackgroundColor,
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 15,
      color: Colors.companyOrange,
    },
    errorMessage: {
      fontSize: 14,
      color: Colors[colorScheme].primaryTextColor,
      textAlign: "center",
      marginBottom: 25,
      paddingHorizontal: 20,
    },
    bold: {
      fontWeight: "bold",
    },
    retryButton: {
      paddingVertical: 10,
      paddingHorizontal: 25,
      backgroundColor: Colors.companyOrange,
      borderRadius: 8,
    },
    retryText: {
      fontSize: 16,
      lineHeight: 20,
      color: Colors[colorScheme].primaryBackgroundColor,
      fontWeight: "600",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: Colors[colorScheme].primaryBackgroundColor,
    },
    loadingText: {
      fontSize: 16,
      color: Colors[colorScheme].primaryTextColor,
    },
  });
