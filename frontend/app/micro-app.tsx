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
import NotFound from "@/components/NotFound";
import Scanner from "@/components/Scanner";
import { Colors } from "@/constants/Colors";
import {
  DEVELOPER_APP_DEFAULT_URL,
  FULL_SCREEN_VIEWING_MODE,
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_SCOPES,
  GOOGLE_WEB_CLIENT_ID,
  isAndroid,
  isIos,
} from "@/constants/Constants";
import { logout, tokenExchange } from "@/services/authService";
import googleAuthenticationService from "@/services/googleService";
import { MicroAppParams } from "@/types/navigation";
import { injectedJavaScript } from "@/utils/bridge";
import { getBridgeHandler, getResolveMethod, getRejectMethod } from "@/utils/bridgeRegistry";
import { BridgeContext } from "@/types/bridge.types";
import * as Google from "expo-auth-session/providers/google";
import { documentDirectory } from "expo-file-system";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import prompt from "react-native-prompt-android";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { useDispatch, useSelector } from "react-redux";

WebBrowser.maybeCompleteAuthSession();
import { BRIDGE_FUNCTION as QR_REQUEST_BRIDGE_FUNCTION } from "@/utils/bridgeHandlers/qrRequest";

const MicroApp = () => {
  const [isScannerVisible, setScannerVisible] = useState(false);

  const { webViewUri, appName, clientId, exchangedToken, appId, displayMode } =
    useLocalSearchParams<MicroAppParams>();
  const [hasError, setHasError] = useState(false);
  const webviewRef = useRef<WebView>(null);
  const [token, setToken] = useState<string | null>();
  const dispatch = useDispatch();
  const router = useRouter();
  const pendingTokenRequestsRef = useRef<((token: string) => void)[]>([]);
  const qrScanCallbackRef = useRef<((qrCode: string) => void) | null>(null);
  const [webUri, setWebUri] = useState<string>(DEVELOPER_APP_DEFAULT_URL);
  const colorScheme = useColorScheme();
  const styles = createStyles(colorScheme ?? "light");
  const isDeveloper: boolean = appId.includes("developer");
  const isTotp: boolean = appId.includes("totp");
  const insets = useSafeAreaInsets();
  const shouldShowHeader: boolean = displayMode !== FULL_SCREEN_VIEWING_MODE;

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    scopes: GOOGLE_SCOPES,
  });

  // Function to send response to micro app
  const sendResponseToWeb = (method: string, data?: any) => {
    webviewRef.current?.injectJavaScript(
      `window.nativebridge.${method}(${JSON.stringify(data)});`
    );
  };

  // Handle Google authentication response
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

  // useEffect(() => {
  //   const fetchToken = async () => {
  //     try {
  //       const token = await tokenExchange(
  //         dispatch,
  //         clientId,
  //         exchangedToken,
  //         appId,
  //         logout
  //       );
  //       if (!token) throw new Error("Token exchange failed");
  //       setToken(token);
  //       sendTokenToWebView(token);
  //     } catch (error) {
  //       console.error("Token exchange error:", error);
  //     }
  //   };

  //   fetchToken();
  // }, [clientId]);

  // Function to send token to WebView
  const sendTokenToWebView = (token: string) => {
    if (!token) return;
    sendResponseToWeb("resolveToken", token);

    // Resolve any pending token requests
    while (pendingTokenRequestsRef.current.length > 0) {
      const resolve = pendingTokenRequestsRef.current.shift();
      resolve?.(token);
    }
  };

  // Handle messages from WebView
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
        topic,
        appID: appId as string,
        token: token || null, // exchanged token
        setScannerVisible,

        sendResponseToWeb: (method: string, data?: any, reqId?: string) => {
          const idToUse = reqId || requestId;
          webviewRef.current?.injectJavaScript(
            `window.nativebridge.${method}(${JSON.stringify(data)}, "${idToUse}");`
          );
        },
        pendingTokenRequests: pendingTokenRequestsRef.current,

        resolve: (data?: any, reqId?: string) => {
          const methodName = getResolveMethod(topic);
          const idToUse = reqId || requestId;
          webviewRef.current?.injectJavaScript(
            `window.nativebridge.${methodName}(${JSON.stringify(data)}, "${idToUse}");`
          );
        },
        reject: (error: string, reqId?: string) => {
          const methodName = getRejectMethod(topic);
          const idToUse = reqId || requestId;
          webviewRef.current?.injectJavaScript(
            `window.nativebridge.${methodName}("${error}", "${idToUse}");`
          );
        },
        // Google authentication
        promptAsync,
        // Navigation
        router,
        // Device info
        insets: {
          top: insets.top,
          bottom: insets.bottom,
          left: insets.left,
          right: insets.right,
        },
        // QR scanner callback
        qrScanCallback: qrScanCallbackRef.current || undefined,
      };
      await handler(data, bridgeContext);

      // Update the ref with any callback set by the handler
      if (topic === QR_REQUEST_BRIDGE_FUNCTION.topic) {
        qrScanCallbackRef.current = bridgeContext.qrScanCallback || null;
      }
    } catch (error) {
      console.error("Error handling WebView message:", error);
    }
  };

  const handleError = (syntheticEvent: any) => {
    setHasError(true);
    console.error("WebView error:", syntheticEvent.nativeEvent);
  };

  const reloadWebView = () => {
    setHasError(false);
    webviewRef.current?.reload();
  };

  const renderWebView = (webViewUri: string) => {
    // Check if web view uri is available
    if (!webViewUri) {
      Alert.alert("Error", "React app not found. Please unzip the file first.");
      return <NotFound />;
    }

    return (
      <View style={{ flex: 1 }}>
        {hasError ? (
          isDeveloper ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorTitle}>Failed to load the app</Text>
              <Text style={styles.errorMessage}>
                Please check if your development server is running on{" "}
                <Text style={styles.bold}>{webViewUri}</Text>, or click the
                header <Text style={styles.bold}>App URL</Text> section to enter
                a valid development server URL.
              </Text>
              <TouchableOpacity
                onPress={reloadWebView}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorTitle}>Something went wrong</Text>
              <Text style={styles.errorMessage}>
                We encountered an issue while loading the app. Please try again
                later.
              </Text>
            </View>
          )
        ) : (
          <WebView
            ref={webviewRef}
            originWhitelist={["*"]}
            source={{
              uri: isDeveloper
                ? webViewUri
                : `${documentDirectory}${webViewUri}`,
            }}
            allowFileAccess
            allowUniversalAccessFromFileURLs
            allowingReadAccessToURL="file:///"
            style={{ flex: 1 }}
            onMessage={onMessage}
            onError={handleError}
            onShouldStartLoadWithRequest={() => true}
            domStorageEnabled
            webviewDebuggingEnabled={isDeveloper}
            injectedJavaScriptBeforeContentLoaded={injectedJavaScript}
          />
        )}
      </View>
    );
  };

  return (
    <>
      {!shouldShowHeader && (
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      )}
      <Stack.Screen
        options={{
          title: shouldShowHeader ? appName : "",
          headerShown: shouldShowHeader,
          headerRight: () =>
            isDeveloper ? (
            shouldShowHeader && (
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
            )) : null,
        }}
      />
      <View style={styles.container}>
        {isScannerVisible && (
          <View style={styles.scannerOverlay}>
            <Scanner
              onScan={(qrCode) => {
                // Call the stored callback from the bridge handler
                if (qrScanCallbackRef.current) {
                  qrScanCallbackRef.current(qrCode);
                }
                setScannerVisible(false);
              }}
              message={
                isTotp
                  ? "We need access to your camera to scan QR codes for generating one-time passwords (TOTP) for secure authentication. This will allow you to easily log in to your accounts."
                  : undefined
              }
            />
          </View>
        )}

        {!shouldShowHeader ? (
          <View
            style={[
              styles.webViewContainer,
              isScannerVisible && styles.webViewHidden,
              { paddingTop: insets.top },
            ]}
          >
            {renderWebView(isDeveloper ? webUri : webViewUri)}
          </View>
        ) : (
          <View
            style={[
              styles.webViewContainer,
              isScannerVisible && styles.webViewHidden,
            ]}
          >
            {renderWebView(isDeveloper ? webUri : webViewUri)}
          </View>
        )}
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
  });
