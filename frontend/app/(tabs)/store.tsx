import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AppDispatch, RootState } from "@/context/store";
import { MicroApp } from "@/context/slices/appSlice";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import {
  downloadMicroApp,
  loadMicroAppDetails,
  removeMicroApp,
} from "@/services/appStoreService";
import { DOWNLOADED, NOT_DOWNLOADED, BASE_URL } from "@/constants/Constants";
import { MicroAppIcon } from "@/components/MicroAppIcon";

export default function Store() {
  const dispatch = useDispatch<AppDispatch>();
  const colorScheme = useColorScheme() ?? "light";
  const { apps, downloading } = useSelector((state: RootState) => state.apps);
  const { accessToken } = useSelector((state: RootState) => state.auth);
  
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [installationQueue, setInstallationQueue] = useState<
    { appId: string; downloadUrl: string }[]
  >([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  const isMountedRef = useRef(true);
  const activeDownloadsRef = useRef(new Set<string>());
  const styles = createStyles(colorScheme ?? "light");


  // Mock logout function
  const logout = async () => {
    console.log("Logout called");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load micro apps list
  useEffect(() => {
    const initializeApps = async () => {
      setIsLoading(true);
      if (accessToken) {
        await loadMicroAppDetails(dispatch, logout);
      }
      setIsLoading(false);
    };

    initializeApps();
  }, [dispatch, accessToken]);

  // Process the installation queue
  useEffect(() => {
    const processQueue = async () => {
      if (isProcessingQueue || installationQueue.length === 0) return;

      setIsProcessingQueue(true);
      const currentItem = installationQueue[0];

      try {
        activeDownloadsRef.current.add(currentItem.appId);

        await downloadMicroApp(
          dispatch,
          currentItem.appId,
          currentItem.downloadUrl,
          logout
        );

        if (isMountedRef.current) {
          setInstallationQueue((prev) => prev.slice(1));
          activeDownloadsRef.current.delete(currentItem.appId);
        }
      } catch (error) {
        console.error("Error processing download queue:", error);
        if (isMountedRef.current) {
          setInstallationQueue((prev) => prev.slice(1));
          activeDownloadsRef.current.delete(currentItem.appId);
        }
      } finally {
        if (isMountedRef.current) {
          setIsProcessingQueue(false);
        }
      }
    };

    processQueue();
  }, [installationQueue, isProcessingQueue, dispatch]);

  const handleInstallMicroApp = async (app: MicroApp) => {
    if (!app.download_url) {
      Alert.alert("Error", "Download URL not available for this app.");
      return;
    }

    // const downloadUrl = app.versions[0].downloadUrl;
    const downloadUrl = app.download_url;

    if (activeDownloadsRef.current.has(app.app_id)) {
      Alert.alert("Info", "This app is already being downloaded.");
      return;
    }

    const isInQueue = installationQueue.some((item) => item.appId === app.app_id);
    if (isInQueue) {
      Alert.alert("Info", "This app is already in the download queue.");
      return;
    }

    setInstallationQueue((prev) => [
      ...prev,
      { appId: app.app_id, downloadUrl },
    ]);
  };

  const handleRemoveMicroApp = async (appId: string) => {
    Alert.alert(
      "Confirm Removal",
      "Are you sure you want to remove this app?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await removeMicroApp(dispatch, appId, logout);
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMicroAppDetails(dispatch, logout);
    setRefreshing(false);
  };

  const renderMicroApp = ({ item }: { item: MicroApp }) => {
    const isDownloading = downloading.includes(item.app_id);
    const isDownloaded = item.status === DOWNLOADED;
    const inQueue = installationQueue.some((qItem) => qItem.appId === item.app_id);

    return (
      <View style={[styles.appCard, { backgroundColor: Colors[colorScheme].secondaryBackgroundColor }]}>
        <View style={styles.appHeader}>
          <View style={styles.appIcon}>
            <MicroAppIcon
              iconUrl={item.icon_url}
              appId={item.app_id}
              size={24}
              color={isDownloaded ? Colors.actionButtonTextColor : Colors[colorScheme].icon}
            />
          </View>
          <View style={styles.appInfo}>
            <Text style={[styles.appName, { color: Colors[colorScheme].primaryTextColor }]}>
              {item.name}
            </Text>
            <Text style={[styles.appDescription, { color: Colors[colorScheme].secondaryTextColor }]} numberOfLines={2}>
              {item.description}
            </Text>
            {item.version && (
              <Text style={[styles.appVersion, { color: Colors[colorScheme].ternaryTextColor }]}>
                Version {String(item.version)}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.actionContainer}>
          {isDownloading || inQueue ? (
            <View style={styles.downloadingContainer}>
              <ActivityIndicator 
                size="small" 
                color={Colors.actionButtonTextColor} 
              />
              <Text style={[styles.downloadingText, { color: Colors[colorScheme].secondaryTextColor }]}>
                {inQueue ? "In Queue" : "Installing..."}
              </Text>
            </View>
          ) : isDownloaded ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.removeButton]}
              onPress={() => handleRemoveMicroApp(item.app_id)}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Remove</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.installButton]}
              onPress={() => handleInstallMicroApp(item)}
              activeOpacity={0.7}
            >
              <Ionicons name="download-outline" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Install</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme].ternaryBackgroundColor }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.actionButtonTextColor} />
          <Text style={[styles.loadingText, { color: Colors[colorScheme].primaryTextColor }]}>
            Loading apps...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>App Store</Text>
          <Text style={styles.headerSubtitle}>Discover and install micro-apps</Text>
        </View>

        <FlatList
          data={apps}
          renderItem={renderMicroApp}
          keyExtractor={(item) => item.app_id}
          contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.actionButtonTextColor]}
            tintColor={Colors.actionButtonTextColor}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons 
              name="storefront-outline" 
              size={64} 
              color={Colors[colorScheme].icon} 
            />
            <Text style={[styles.emptyText, { color: Colors[colorScheme].secondaryTextColor }]}>
              No apps available
            </Text>
            <Text style={[styles.emptySubtext, { color: Colors[colorScheme].ternaryTextColor }]}>
              Pull down to refresh
            </Text>
          </View>
        }
      />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colorScheme: "light" | "dark") => StyleSheet.create({
  container: {
    flex: 1,
    marginTop:10,
    backgroundColor: Colors[colorScheme].primaryBackgroundColor,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
  },
  header: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors[colorScheme].ternaryBackgroundColor,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors[colorScheme].primaryTextColor,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors[colorScheme].secondaryTextColor,
  },
  listContainer: {
    padding:10,
    // paddingTop: 10,
  },
  appCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 3.84,
    elevation: 2,
  },
  appHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  appIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  appDescription: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
  appVersion: {
    fontSize: 12,
    fontWeight: "500",
  },
  actionContainer: {
    alignItems: "flex-end",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  installButton: {
    backgroundColor: Colors.actionButtonTextColor,
        shadowColor: Colors.actionButtonTextColor,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 3.84,
    elevation: 10,
  },
  removeButton: {
    backgroundColor: Colors.removeButtonTextColor,
            shadowColor: Colors.removeButtonTextColor,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 3.84,
    elevation: 10,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  downloadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  downloadingText: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
  },
});