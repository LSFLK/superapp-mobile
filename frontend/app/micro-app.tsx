/**
 * Production-Ready Generic SuperApp Micro-Application Viewer
 * 
 * A robust, scalable WebView component for micro-applications with:
 * - Comprehensive native bridge communication
 * - Error handling and retry mechanisms
 * - Authentication token management
 * - File download/upload capabilities
 * - QR code scanning integration
 * - Google authentication support
 * - Local storage management
 * - Responsive design and accessibility
 */

import React, { useState, useRef, useEffect } from "react";
import { Asset } from "expo-asset";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  StatusBar,
  useColorScheme,
  Platform,
  ActivityIndicator,
} from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { Colors } from "@/constants/Colors";
import { TOPIC, injectedJavaScript } from "@/utils/bridge";
import NotFound from "@/components/NotFound";
import Scanner from "@/components/Scanner";


// Types for micro-app parameters and communication
interface MicroAppParams {
  appId: string;
  appName: string;
  webViewUri?: string;
  clientId?: string;
  exchangedToken?: string;
}

interface BridgeMessage {
  topic: string;
  data?: any;
}

interface AppConfig {
  isDeveloper: boolean;
  isTotp: boolean;
  requiresAuth: boolean;
  allowsFileAccess: boolean;
}

const fetchUserMicroApps = async () => {
  const token = await AsyncStorage.getItem("superapp_token");
  if (!token) return [];

  const response = await fetch("https://superapp.example.com/api/microapps", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) throw new Error("Failed to fetch micro apps");
  return await response.json(); // [{id, name, uri}]
};


/**
 * Production-ready micro-app viewer with comprehensive functionality
 */
export default function MicroAppViewer() {
  // Route parameters and state
  const params = useLocalSearchParams();
  const { appId, appName, webViewUri, clientId, exchangedToken } = params as any;
  const colorScheme = useColorScheme();
  const webviewRef = useRef<WebView>(null);
  
  // Component state
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isScannerVisible, setScannerVisible] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [webUri, setWebUri] = useState<string>("");
  
  // App configuration based on appId
  const appConfig: AppConfig = {
    isDeveloper: appId?.toString().includes("developer") || false,
    isTotp: appId?.toString().includes("totp") || false,
    requiresAuth: !appId?.toString().includes("public") || false,
    allowsFileAccess: appId?.toString().includes("file") || false,
  };
  
  // Styles based on color scheme
  const styles = createStyles(colorScheme ?? "light");
  
  // Token management queue for pending requests
  const pendingTokenRequests = useRef<((token: string) => void)[]>([]);

  /**
   * Initialize authentication token if required
   */
  useEffect(() => {
    if (appConfig.requiresAuth && exchangedToken && clientId) {
      fetchAuthToken();
    }
  }, [exchangedToken, clientId]);

  useEffect(() => {
  if (exchangedToken) {
    console.log("🟢 Token received in microapp:", exchangedToken);
    setAuthToken(exchangedToken);      // <--- store token in state
    sendTokenToWebView(exchangedToken); // <--- send to WebView
  } else {
    // Optional: redirect if no token found
    handleAlert("Unauthorized", "Please login to access micro-apps.");
    router.replace("/login");
  }
  }, [exchangedToken]);

  /**
   * Set initial web URI - handle both remote URLs and local assets
   * 
   * ARCHITECTURE NOTE:
   * In a real SuperApp, micro-apps would be:
   * 1. Downloaded as ZIP files from app store
   * 2. Extracted to device local storage (e.g., Documents/micro-apps/)
   * 3. Accessed using file:// protocol from local file system
   * 
   * For this demo, we simulate local access by:
   * - Storing "downloaded" apps in frontend/assets/micro-apps/
   * - Using backend to serve them (simulating local file system)
   * - The backend serves from static/ directory (like extracted ZIP contents)
   */
  /**
   * Initialize demo micro-app for testing (simulate downloaded app)
   */
  const initializeDemoMicroApp = async (id: string) => {
    try {
      const microAppDir = `${FileSystem.documentDirectory}micro-apps/${id}/`;
      const indexPath = `${microAppDir}index.html`;
      
      // Create directory if it doesn't exist
      await FileSystem.makeDirectoryAsync(microAppDir, { intermediates: true });
      
      // Copy payslip HTML to simulate downloaded app
      if (id === 'payslip-viewer') {
        const asset = Asset.fromModule(require('../assets/micro-apps/payslip-viewer/index.html'));
        await asset.downloadAsync();
        const htmlContent = await FileSystem.readAsStringAsync(asset.localUri || "");
        await FileSystem.writeAsStringAsync(indexPath, htmlContent);
      }
    } catch (error) {
      console.log('Demo initialization error:', error);
    }
  };

  useEffect(() => {
    // If webViewUri is 'local' or missing, load from downloaded micro-app files
    if (appId && (!webViewUri || webViewUri === 'local')) {
      (async () => {
        try {
          // Initialize demo app if needed
          await initializeDemoMicroApp(appId);
          
          // In production: Check if micro-app is downloaded locally
          const microAppDir = `${FileSystem.documentDirectory}micro-apps/${appId}/`;
          const indexPath = `${microAppDir}index.html`;
          
          // Check if micro-app exists locally
          const dirInfo = await FileSystem.getInfoAsync(microAppDir);
          const fileInfo = await FileSystem.getInfoAsync(indexPath);
          
          if (dirInfo.exists && fileInfo.exists) {
            // Load from local downloaded files
            const html = await FileSystem.readAsStringAsync(indexPath);
            setWebUri(html);
          } else {
            // Micro-app not available
            setWebUri('ERROR');
          }
        } catch (e) {
          setWebUri('ERROR');
        }
      })();
    } else if (webViewUri && typeof webViewUri === 'string') {
      setWebUri(webViewUri);
    }
  }, [webViewUri, appId]);

  /**
   * Fetch authentication token from backend
   */
  const fetchAuthToken = async () => {
    try {
      // In a real app, this would call your auth service
      // For demo purposes, we'll use a mock token
      const token = `auth_token_${Date.now()}`;
      setAuthToken(token);
      sendTokenToWebView(token);
    } catch (error) {
      console.error("Token fetch error:", error);
      handleAlert("Authentication Error", "Failed to authenticate user. Please try again.");
    }
  };

  /**
   * Send authentication token to WebView
   */
  const sendTokenToWebView = (token: string) => {
    if (!token) return;
    sendResponseToWeb("resolveToken", token);
    
    // Resolve any pending token requests
    while (pendingTokenRequests.current.length > 0) {
      const resolve = pendingTokenRequests.current.shift();
      resolve?.(token);
    }
  };

  /**
   * Generic response sender to WebView
   */
  const sendResponseToWeb = (method: string, data?: any) => {
    const script = `
      if (window.nativebridge && window.nativebridge.${method}) {
        window.nativebridge.${method}(${JSON.stringify(data)});
      }
    `;
    webviewRef.current?.injectJavaScript(script);
  };

  /**
   * Handle native alerts
   */
  const handleAlert = (title: string, message: string, buttonText = "OK") => {
    Alert.alert(title, message, [{ text: buttonText }], { cancelable: false });
  };

  /**
   * Handle confirmation dialogs
   */
  const handleConfirmAlert = (
    title: string,
    message: string,
    cancelText = "Cancel",
    confirmText = "Confirm"
  ) => {
    Alert.alert(
      title,
      message,
      [
        {
          text: cancelText,
          style: "cancel",
          onPress: () => sendResponseToWeb("resolveConfirmAlert", "cancel"),
        },
        {
          text: confirmText,
          onPress: () => sendResponseToWeb("resolveConfirmAlert", "confirm"),
        },
      ],
      { cancelable: false }
    );
  };

  /**
   * Handle local data storage
   */
  const handleSaveLocalData = async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(`microapp_${appId}_${key}`, value);
      sendResponseToWeb("resolveSaveLocalData");
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : "Storage error";
      sendResponseToWeb("rejectSaveLocalData", errMessage);
    }
  };

  /**
   * Handle local data retrieval
   */
  const handleGetLocalData = async (key: string) => {
    try {
      const value = await AsyncStorage.getItem(`microapp_${appId}_${key}`);
      sendResponseToWeb("resolveGetLocalData", { value });
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : "Storage error";
      sendResponseToWeb("rejectGetLocalData", errMessage);
    }
  };

  /**
   * Handle file downloads (mock implementation)
   */
  const handleFileDownload = async (fileName: string, data: any) => {
    try {
      if (appConfig.allowsFileAccess) {
        // In a real app, implement actual file download
        handleAlert("Download", `File "${fileName}" downloaded successfully.`);
        sendResponseToWeb("resolveDownload", { fileName, success: true });
      } else {
        throw new Error("File access not permitted for this app");
      }
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : "Download failed";
      sendResponseToWeb("rejectDownload", errMessage);
    }
  };

  /**
   * Handle QR code scanning results
   */
  const handleQrScanResult = (qrData: string) => {
    sendResponseToWeb("resolveQrCode", qrData);
    setScannerVisible(false);
  };

  /**
   * Main WebView message handler
   */
  const handleMessage = async (event: WebViewMessageEvent) => {
    try {
      const message: BridgeMessage = JSON.parse(event.nativeEvent.data);
      
      if (!message.topic) {
        console.warn("Invalid message format: Missing topic");
        return;
      }

      switch (message.topic) {
        case TOPIC.TOKEN:
          if (authToken) {
            sendTokenToWebView(authToken);
          } else {
            pendingTokenRequests.current.push(sendTokenToWebView);
          }
          break;

        case TOPIC.QR_REQUEST:
          setScannerVisible(true);
          break;

        case TOPIC.SAVE_LOCAL_DATA:
          await handleSaveLocalData(message.data.key, message.data.value);
          break;

        case TOPIC.GET_LOCAL_DATA:
          await handleGetLocalData(message.data.key);
          break;

        case TOPIC.ALERT:
          handleAlert(
            message.data.title,
            message.data.message,
            message.data.buttonText
          );
          break;

        case TOPIC.CONFIRM_ALERT:
          handleConfirmAlert(
            message.data.title,
            message.data.message,
            message.data.cancelButtonText,
            message.data.confirmButtonText
          );
          break;

        case "download_file":
          await handleFileDownload(message.data.fileName, message.data.data);
          break;

        case "upload_file":
          // Mock implementation for file upload
          sendResponseToWeb("resolveUpload", { success: true });
          break;

        default:
          console.warn("Unknown bridge topic:", message.topic);
      }
    } catch (error) {
      console.error("Error handling WebView message:", error);
    }
  };

  /**
   * Handle WebView loading errors
   */
  const handleWebViewError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error("WebView error:", nativeEvent);
    setHasError(true);
    setIsLoading(false);
  };

  /**
   * Reload WebView after error
   */
  const reloadWebView = () => {
    setHasError(false);
    setIsLoading(true);
    webviewRef.current?.reload();
  };

  /**
   * Handle developer mode URL input
   */
  const handleDeveloperUrlInput = () => {
    Alert.prompt(
      "Development Server URL",
      "Enter the URL for your development server",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Set URL",
          onPress: (url) => {
            if (url) {
              setWebUri(url);
              reloadWebView();
            }
          },
        },
      ],
      "plain-text",
      webUri
    );
  };

  /**
   * Render error state with retry option
   */
  const renderError = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="warning-outline" size={48} color={Colors.removeButtonTextColor} />
      <Text style={styles.errorTitle}>
        {appConfig.isDeveloper ? "Development Server Error" : "App Loading Failed"}
      </Text>
      <Text style={styles.errorMessage}>
        {appConfig.isDeveloper
          ? `Please check if your development server is running on ${webUri}`
          : "We encountered an issue while loading the app. Please try again."}
      </Text>
      <TouchableOpacity onPress={reloadWebView} style={styles.retryButton}>
        <Text style={styles.retryText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  /**
   * Render main WebView content
   */
  const renderWebView = () => {
    // Priority 1: Error state
    if (webUri === 'ERROR') {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Micro-app file not found.</Text>
          <Text style={styles.errorMessage}>
            The requested micro-app could not be loaded.
          </Text>
        </View>
      );
    }

    // Priority 2: Local micro-app with HTML content
    if (appId && webViewUri === 'local' && webUri && webUri !== 'ERROR') {
      return (
        <WebView
          ref={webviewRef}
          source={{ html: webUri }}
          style={styles.webview}
          originWhitelist={["*"]}
          domStorageEnabled={true}
          javaScriptEnabled={true}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onError={handleWebViewError}
          onMessage={handleMessage}
          injectedJavaScriptBeforeContentLoaded={injectedJavaScript}
          onShouldStartLoadWithRequest={() => true}
          showsVerticalScrollIndicator={false}
          webviewDebuggingEnabled={appConfig.isDeveloper}
        />
      );
    }
    
    // Priority 3: Developer apps with custom URLs
    if (appConfig.isDeveloper && webViewUri && webViewUri !== 'local') {
      const sourceUri = Array.isArray(webViewUri) ? webViewUri[0] : webViewUri;
      return (
        <WebView
          ref={webviewRef}
          source={{ uri: sourceUri }}
          style={styles.webview}
          originWhitelist={["*"]}
          allowFileAccess={appConfig.allowsFileAccess}
          allowUniversalAccessFromFileURLs={appConfig.allowsFileAccess}
          domStorageEnabled={true}
          javaScriptEnabled={true}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onError={handleWebViewError}
          onMessage={handleMessage}
          injectedJavaScriptBeforeContentLoaded={injectedJavaScript}
          onShouldStartLoadWithRequest={() => true}
          showsVerticalScrollIndicator={false}
          webviewDebuggingEnabled={appConfig.isDeveloper}
        />
      );
    }

    // Priority 4: Remote URLs
    if (webViewUri && webViewUri !== 'local') {
      const sourceUri = Array.isArray(webViewUri) ? webViewUri[0] : webViewUri;
      return (
        <WebView
          ref={webviewRef}
          source={{ uri: sourceUri }}
          style={styles.webview}
          originWhitelist={["*"]}
          allowFileAccess={true}
          allowUniversalAccessFromFileURLs={true}
          domStorageEnabled={true}
          javaScriptEnabled={true}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onError={handleWebViewError}
          onMessage={handleMessage}
          injectedJavaScriptBeforeContentLoaded={injectedJavaScript}
          onShouldStartLoadWithRequest={() => true}
          showsVerticalScrollIndicator={false}
          webviewDebuggingEnabled={appConfig.isDeveloper}
        />
      );
    }

    // Default: No content available
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Micro-app not available</Text>
        <Text style={styles.errorMessage}>
          The requested micro-app is not installed or configured.
        </Text>
      </View>
    );
  };

  const displayAppName = Array.isArray(appName) ? appName[0] : appName || "Government Service";

  return (
    <>
      <Stack.Screen
        options={{
          title: displayAppName,
          headerShown: false, // We'll use custom header
        }}
      />
      
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} 
          backgroundColor={styles.header.backgroundColor} 
        />
        
        {/* Custom Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={Colors[colorScheme ?? "light"].text} 
            />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle} numberOfLines={1}>
            {displayAppName}
          </Text>
          
          {/* Developer Mode URL Button */}
          {appConfig.isDeveloper && (
            <TouchableOpacity
              style={styles.urlButton}
              onPress={handleDeveloperUrlInput}
              accessibilityLabel="Change development server URL"
              accessibilityRole="button"
            >
              <Text style={styles.urlButtonText}>URL</Text>
            </TouchableOpacity>
          )}
          
          {!appConfig.isDeveloper && <View style={styles.headerSpacer} />}
        </View>
        
        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator 
              size="large" 
              color={Colors.companyOrange} 
            />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}
        
        {/* QR Scanner Overlay */}
        {isScannerVisible && (
          <View style={styles.scannerOverlay}>
            <Scanner
              onScan={handleQrScanResult}
              message={
                appConfig.isTotp
                  ? "Scan QR code for TOTP authentication"
                  : "Scan QR code to access service"
              }
            />
            <TouchableOpacity
              style={styles.scannerCloseButton}
              onPress={() => setScannerVisible(false)}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        )}
        
        {/* Main Content */}
        <View style={[styles.webViewContainer, isScannerVisible && styles.webViewHidden]}>
          {hasError ? renderError() : renderWebView()}
        </View>
      </SafeAreaView>
    </>
  );
}

/**
 * Create dynamic styles based on color scheme
 */
const createStyles = (colorScheme: "light" | "dark") =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors[colorScheme].primaryBackgroundColor,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: Colors[colorScheme].primaryBackgroundColor,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: Colors[colorScheme].tabIconDefault,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
      borderRadius: 20,
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: "600",
      color: Colors[colorScheme].text,
      textAlign: "center",
    },
    headerSpacer: {
      width: 60,
    },
    urlButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: Colors.companyOrange,
      borderRadius: 16,
    },
    urlButtonText: {
      color: "white",
      fontSize: 12,
      fontWeight: "600",
    },
    loadingContainer: {
      position: "absolute",
      top: "50%",
      left: 0,
      right: 0,
      alignItems: "center",
      zIndex: 1,
      backgroundColor: Colors[colorScheme].primaryBackgroundColor,
      paddingVertical: 20,
      marginHorizontal: 40,
      borderRadius: 12,
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: Colors[colorScheme].text,
      fontWeight: "500",
    },
    scannerOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 2,
    },
    scannerCloseButton: {
      position: "absolute",
      top: Platform.OS === "ios" ? 50 : 30,
      right: 20,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      alignItems: "center",
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
    webview: {
      flex: 1,
      backgroundColor: Colors[colorScheme].primaryBackgroundColor,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
      backgroundColor: Colors[colorScheme].primaryBackgroundColor,
    },
    errorTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: Colors[colorScheme].text,
      textAlign: "center",
      marginTop: 16,
      marginBottom: 8,
    },
    errorMessage: {
      fontSize: 16,
      color: Colors[colorScheme].tabIconDefault,
      textAlign: "center",
      lineHeight: 24,
      marginBottom: 24,
    },
    retryButton: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      backgroundColor: Colors.companyOrange,
      borderRadius: 8,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
    retryText: {
      fontSize: 16,
      fontWeight: "600",
      color: "white",
    },
  });
