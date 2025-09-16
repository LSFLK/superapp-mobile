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
<<<<<<< HEAD
=======
  ScrollView,
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
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
<<<<<<< HEAD
import { DOWNLOADED, NOT_DOWNLOADED, SUPERAPP_BASE_URL } from "@/constants/Constants";

export default function Store() {
  const dispatch = useDispatch<AppDispatch>();
  const colorScheme = useColorScheme();
=======
import { DOWNLOADED, NOT_DOWNLOADED, BASE_URL } from "@/constants/Constants";
import { MicroAppIcon } from "@/components/MicroAppIcon";

export default function Store() {
  const dispatch = useDispatch<AppDispatch>();
  const colorScheme = useColorScheme() ?? "light";
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
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
<<<<<<< HEAD
=======
  const styles = createStyles(colorScheme ?? "light");

>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564

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
    if (!app.versions?.[0]?.downloadUrl) {
      Alert.alert("Error", "Download URL not available for this app.");
      return;
    }

    // const downloadUrl = app.versions[0].downloadUrl;
<<<<<<< HEAD
    const downloadUrl = `${SUPERAPP_BASE_URL}/micro-apps/`+app.appId+`/download`
=======
    const downloadUrl = `${BASE_URL}/micro-apps/`+app.appId+`/download`
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564

    if (activeDownloadsRef.current.has(app.appId)) {
      Alert.alert("Info", "This app is already being downloaded.");
      return;
    }

    const isInQueue = installationQueue.some((item) => item.appId === app.appId);
    if (isInQueue) {
      Alert.alert("Info", "This app is already in the download queue.");
      return;
    }

    setInstallationQueue((prev) => [
      ...prev,
      { appId: app.appId, downloadUrl },
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
    const isDownloading = downloading.includes(item.appId);
    const isDownloaded = item.status === DOWNLOADED;
    const inQueue = installationQueue.some((qItem) => qItem.appId === item.appId);

    return (
<<<<<<< HEAD
      <View style={[styles.appCard, { backgroundColor: '#FFFFFF' }]}>
        <View style={styles.appHeader}>
          <View style={styles.appIcon}>
            <Ionicons name="apps" size={32} color="#2563EB" />
          </View>
          <View style={styles.appInfo}>
            <Text style={[styles.appName, { color: '#1F2937' }]}>
              {item.name}
            </Text>
            <Text style={[styles.appDescription, { color: '#374151' }]}>
              {item.description}
            </Text>
            {item.versions?.[0] && (
              <Text style={[styles.appVersion, { color: '#374151' }]}>
=======
      <View style={[styles.appCard, { backgroundColor: Colors[colorScheme].secondaryBackgroundColor }]}>
        <View style={styles.appHeader}>
          <View style={styles.appIcon}>
            <MicroAppIcon
              iconUrl={item.iconUrl}
              appId={item.appId}
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
            {item.versions?.[0] && (
              <Text style={[styles.appVersion, { color: Colors[colorScheme].ternaryTextColor }]}>
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
                Version {item.versions[0].version}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.actionContainer}>
          {isDownloading || inQueue ? (
            <View style={styles.downloadingContainer}>
<<<<<<< HEAD
              <ActivityIndicator size="small" color="#2563EB" />
              <Text style={[styles.downloadingText, { color: '#374151' }]}>
                {inQueue ? "In Queue" : "Downloading..."}
=======
              <ActivityIndicator 
                size="small" 
                color={Colors.actionButtonTextColor} 
              />
              <Text style={[styles.downloadingText, { color: Colors[colorScheme].secondaryTextColor }]}>
                {inQueue ? "In Queue" : "Installing..."}
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
              </Text>
            </View>
          ) : isDownloaded ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.removeButton]}
              onPress={() => handleRemoveMicroApp(item.appId)}
<<<<<<< HEAD
=======
              activeOpacity={0.7}
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
            >
              <Ionicons name="trash-outline" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Remove</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.installButton]}
              onPress={() => handleInstallMicroApp(item)}
<<<<<<< HEAD
=======
              activeOpacity={0.7}
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
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
<<<<<<< HEAD
      <SafeAreaView style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>
=======
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme].ternaryBackgroundColor }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.actionButtonTextColor} />
          <Text style={[styles.loadingText, { color: Colors[colorScheme].primaryTextColor }]}>
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
            Loading apps...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
<<<<<<< HEAD
    <SafeAreaView style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          App Store
        </Text>
        <Text style={styles.headerSubtitle}>
          Discover and install micro-apps
        </Text>
      </View>

      <FlatList
        data={apps}
        renderItem={renderMicroApp}
        keyExtractor={(item) => item.appId}
        contentContainerStyle={styles.listContainer}
=======
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>App Store</Text>
          <Text style={styles.headerSubtitle}>Discover and install micro-apps</Text>
        </View>

        <FlatList
          data={apps}
          renderItem={renderMicroApp}
          keyExtractor={(item) => item.appId}
          contentContainerStyle={styles.listContainer}
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
<<<<<<< HEAD
            colors={['#2563EB']}
=======
            colors={[Colors.actionButtonTextColor]}
            tintColor={Colors.actionButtonTextColor}
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons 
<<<<<<< HEAD
              name="apps-outline" 
              size={64} 
              color="#9CA3AF" 
            />
            <Text style={[styles.emptyText, { color: '#9CA3AF' }]}>
              No apps available
            </Text>
            <Text style={[styles.emptySubtext, { color: '#9CA3AF' }]}>
=======
              name="storefront-outline" 
              size={64} 
              color={Colors[colorScheme].icon} 
            />
            <Text style={[styles.emptyText, { color: Colors[colorScheme].secondaryTextColor }]}>
              No apps available
            </Text>
            <Text style={[styles.emptySubtext, { color: Colors[colorScheme].ternaryTextColor }]}>
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
              Pull down to refresh
            </Text>
          </View>
        }
      />
<<<<<<< HEAD
=======
      </View>
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
    </SafeAreaView>
  );
}

<<<<<<< HEAD
const styles = StyleSheet.create({
  container: {
    flex: 1,
=======
const createStyles = (colorScheme: "light" | "dark") => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors[colorScheme].primaryBackgroundColor,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 15,
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
<<<<<<< HEAD
    color: "#1F2937",
    fontWeight: "500",
  },
  header: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: 24,
    paddingTop: 30,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  listContainer: {
    padding: 16,
=======
    fontWeight: "500",
  },
  header: {
    marginBottom: 24,
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
    paddingTop: 0,
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
  },
  appCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  appHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  appIcon: {
    width: 48,
    height: 48,
<<<<<<< HEAD
    borderRadius: 8,
=======
    borderRadius: 12,
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
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
<<<<<<< HEAD
  },
  appVersion: {
    fontSize: 12,
=======
    lineHeight: 20,
  },
  appVersion: {
    fontSize: 12,
    fontWeight: "500",
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
  },
  actionContainer: {
    alignItems: "flex-end",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
<<<<<<< HEAD
    borderRadius: 6,
    gap: 6,
  },
  installButton: {
    backgroundColor: "#2563EB",
  },
  removeButton: {
    backgroundColor: "#DC2626",
=======
    borderRadius: 8,
    gap: 6,
  },
  installButton: {
    backgroundColor: Colors.actionButtonTextColor,
  },
  removeButton: {
    backgroundColor: Colors.removeButtonTextColor,
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
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
<<<<<<< HEAD
=======
    fontWeight: "500",
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
<<<<<<< HEAD
=======
    paddingHorizontal: 20,
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
<<<<<<< HEAD
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
=======
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
  },
});
