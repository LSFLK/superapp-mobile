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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  DEVELOPER_APP_DEFAULT_URL,
  FULL_SCREEN_VIEWING_MODE,
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_SCOPES,
  GOOGLE_WEB_CLIENT_ID,
  isIos,
} from "@/constants/Constants";
import { logout, tokenExchange } from "@/services/authService";
import googleAuthenticationService, {
  getGoogleUserInfo,
  isAuthenticatedWithGoogle,
  restoreGoogleDriveBackup,
  uploadToGoogleDrive,
} from "@/services/googleService";
import { MicroAppParams } from "@/types/navigation";
import { injectedJavaScript, TOPIC } from "@/utils/bridge";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Google from "expo-auth-session/providers/google";
import { documentDirectory } from "expo-file-system";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
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
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { useDispatch } from "react-redux";

WebBrowser.maybeCompleteAuthSession();

type NativeLogLevel = "info" | "warn" | "error";

const MicroApp = () => {
  const [isScannerVisible, setScannerVisible] = useState(false);

  const { webViewUri, appName, clientId, exchangedToken, appId, displayMode } =
    useLocalSearchParams<MicroAppParams>();
  const [hasError, setHasError] = useState(false);
  const webviewRef = useRef<WebView>(null);
  const [token, setToken] = useState<string | null>();
  const dispatch = useDispatch();
  const router = useRouter();
  const pendingTokenRequests: ((token: string) => void)[] = [];
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
  }, [clientId]);

  // Function to send token to WebView
  const sendTokenToWebView = (token: string) => {
    if (!token) return;
    sendResponseToWeb("resolveToken", token);

    // Resolve any pending token requests
    while (pendingTokenRequests.length > 0) {
      const resolve = pendingTokenRequests.shift();
      resolve?.(token);
    }
  };

  // Function to send QR string to WebView
  const sendQrToWebView = (qrString: string) => {
    sendResponseToWeb("resolveQrCode", qrString);
  };

  // Function to view alert from parent app
  const handleAlert = async (
    title: string,
    message: string,
    buttonText: string
  ) => {
    Alert.alert(title, message, [{ text: buttonText }], { cancelable: false });
  };

  // Function to get confirmation from parent app
  const handleConfirmAlert = async (
    title: string,
    message: string,
    cancelButtonText: string,
    confirmButtonText: string
  ) => {
    Alert.alert(
      title,
      message,
      [
        {
          text: cancelButtonText,
          style: "cancel",
          onPress: () => sendResponseToWeb("resolveConfirmAlert", "cancel"),
        },
        {
          text: confirmButtonText,
          onPress: () => sendResponseToWeb("resolveConfirmAlert", "confirm"),
        },
      ],
      { cancelable: false }
    );
  };

  // Function to save data in device
  const handleSaveLocalData = async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
      sendResponseToWeb("resolveSaveLocalData");
    } catch (error) {
      const errMessage =
        error instanceof Error ? error.message : "Unknown error";
      sendResponseToWeb("rejectSaveLocalData", errMessage);
    }
  };

  // Function to get data from device
  const handleGetLocalData = async (key: string) => {
    try {
      const value = await AsyncStorage.getItem(key);
      sendResponseToWeb("resolveGetLocalData", { value });
    } catch (error) {
      const errMessage =
        error instanceof Error ? error.message : "Unknown error";
      sendResponseToWeb("rejectSaveLocalData", errMessage);
    }
  };

  // Function to migrate TOTP data
  const handleTotpQrMigrationData = () => {
    const mockData = "sample-data-1,sample-data-2";
    sendResponseToWeb("resolveTotpQrMigrationData", { data: mockData });
  };

  // Fucntion to authenticate using google
  const authenticateWithGoogle = async () => {
    promptAsync();
  };

  // Function to upload data to the Google Drive
  const handledUploadToGoogleDrive = async (data: any = {}) => {
    uploadToGoogleDrive(data)
      .then((res) => {
        if (res.id) {
          sendResponseToWeb("resolveUploadToGoogleDrive", res);
        } else {
          sendResponseToWeb("rejectUploadToGoogleDrive", res.error);
        }
      })
      .catch((err) => {
        sendResponseToWeb("rejectUploadToGoogleDrive", err.message);
      });
  };

  // Function to check Google authentication state
  const handleCheckGoogleAuthState = async () => {
    isAuthenticatedWithGoogle()
      .then((res) => {
        if (res) {
          sendResponseToWeb("resolveGoogleAuthState", res);
        } else {
          sendResponseToWeb("rejectGoogleAuthState", "Not authenticated");
        }
      })
      .catch((err) => {
        sendResponseToWeb("rejectGoogleAuthState", err.message);
      });
  };

  // Function to restore the latest backup from Google Drive
  const RestoreLatestFromGoogleDrive = async () => {
    restoreGoogleDriveBackup()
      .then((res) => {
        if (res) {
          sendResponseToWeb("resolveRestoreGoogleDriveBackup", res.data);
        } else {
          sendResponseToWeb("rejectRestoreGoogleDriveBackup", res.error);
        }
      })
      .catch((err) => {
        sendResponseToWeb("rejectRestoreGoogleDriveBackup", err.message);
      });
  };

  // Function to get Google user info
  const handleGetGoogleUserInfo = async () => {
    try {
      getGoogleUserInfo()
        .then((res) => {
          if (res) {
            sendResponseToWeb("resolveGoogleUserInfo", res);
          } else {
            sendResponseToWeb("rejectGoogleUserInfo", "No user info found");
          }
        })
        .catch((err) => {
          sendResponseToWeb("rejectGoogleUserInfo", err.message);
        });
    } catch (error) {
      console.error("Error getting Google user info:", error);
      sendResponseToWeb("rejectGoogleUserInfo", "Failed to get user info");
    }
  };

  // Handle messages from WebView
  const onMessage = async (event: WebViewMessageEvent) => {
    try {
      const { topic, data } = JSON.parse(event.nativeEvent.data);
      if (!topic) throw new Error("Invalid message format: Missing topic");
      switch (topic) {
        case TOPIC.TOKEN:
          token
            ? sendTokenToWebView(token)
            : pendingTokenRequests.push(sendTokenToWebView);
          break;
        case TOPIC.QR_REQUEST:
          setScannerVisible(true);
          break;
        case TOPIC.SAVE_LOCAL_DATA:
          await handleSaveLocalData(data.key, data.value);
          break;
        case TOPIC.GET_LOCAL_DATA:
          await handleGetLocalData(data.key);
          break;
        case TOPIC.TOTP:
          handleTotpQrMigrationData();
          break;
        case TOPIC.ALERT:
          handleAlert(data.title, data.message, data.buttonText);
          break;
        case TOPIC.CONFIRM_ALERT:
          handleConfirmAlert(
            data.title,
            data.message,
            data.cancelButtonText,
            data.confirmButtonText
          );
          break;
        case TOPIC.GOOGLE_LOGIN:
          authenticateWithGoogle();
          break;
        case TOPIC.UPLOAD_TO_GOOGLE_DRIVE:
          handledUploadToGoogleDrive(data);
          break;
        case TOPIC.RESTORE_GOOGLE_DRIVE_BACKUP:
          RestoreLatestFromGoogleDrive();
          break;
        case TOPIC.CHECK_GOOGLE_AUTH_STATE:
          handleCheckGoogleAuthState();
          break;
        case TOPIC.GOOGLE_USER_INFO:
          handleGetGoogleUserInfo();
          break;
        case TOPIC.CLOSE_WEBVIEW_FROM_MICROAPP:
          router.back();
          break;
        case TOPIC.NATIVE_LOG:
          handleNativeLog(data);
          break;
        default:
          console.error("Unknown topic:", topic);
      }
    } catch (error) {
      console.error("Error handling WebView message:", error);
    }
  };

  /**
   * Display microapp logs in the console
   * @param data - The data to display
   */
  const handleNativeLog = (data: any) => {
    if (!__DEV__) return;
    const level = data.level as NativeLogLevel;
    const message = data.message;
    const injectedData = data.data;

    switch (level) {
      case "info":
        console.info(
          `[Micro App] ${message}.`,
          injectedData !== undefined ? injectedData : ""
        );
        break;
      case "warn":
        console.warn(
          `[Micro App] ${message}.`,
          injectedData !== undefined ? injectedData : ""
        );
        break;
      case "error":
        console.error(
          `[Micro App] ${message}.`,
          injectedData !== undefined ? injectedData : ""
        );
        break;
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
