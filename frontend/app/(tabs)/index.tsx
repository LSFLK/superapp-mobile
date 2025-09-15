/**
 * Government SuperApp - Home Screen
 * 
 * Production-ready home screen with clean architecture and dynamic loading
 */

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useDispatch, useSelector } from "react-redux";

// Store and types
import { AppDispatch, RootState } from "@/context/store";
import { MicroApp } from "@/context/slices/appSlice";
import { getDetailedUserInfo } from "@/context/slices/userInfoSlice";

// Services
import { loadMicroAppDetails } from "@/services/appStoreService";
import { logout } from "@/services/authService";

// Components
import { HomeHeader } from "@/components/HomeHeader";
import { MicroAppCard } from "@/components/MicroAppCard";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";

// Constants
import { ScreenPaths } from "@/constants/ScreenPaths";
import { DOWNLOADED } from "@/constants/Constants";
import { Colors } from "@/constants/Colors";

// Hooks
import { useColorScheme } from "@/hooks/useColorScheme";

// Types
interface HomeScreenState {
  refreshing: boolean;
  initialLoading: boolean;
  error: string | null;
}

/**
 * Main Home Screen Component
 */
export default function HomeScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const colorScheme = useColorScheme() ?? "light";
  
  // Local state
  const [state, setState] = useState<HomeScreenState>({
    refreshing: false,
    initialLoading: true,
    error: null,
  });

  // Redux selectors
  const { accessToken } = useSelector((state: RootState) => state.auth);
  const { userInfo, loading: userInfoLoading } = useSelector((state: RootState) => state.userInfo);
  const { apps } = useSelector((state: RootState) => state.apps);

  // Memoized computations - only show downloaded apps
  const downloadedApps = useMemo(() => {
    return apps.filter(app => app && app.appId && app.status === DOWNLOADED);
  }, [apps]);

  // Callbacks
  const updateState = useCallback((updates: Partial<HomeScreenState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const fetchDetailedUser = useCallback(async () => {
    if (!userInfo?.workEmail) return;
    
    try {
      await dispatch(getDetailedUserInfo({
        email: userInfo.workEmail,
        onLogout: logout
      })).unwrap();
    } catch (error) {
      console.error("Failed to fetch detailed user info:", error);
      updateState({ error: "Failed to load user information" });
    }
  }, [dispatch, userInfo?.workEmail, updateState]);

  const loadApps = useCallback(async () => {
    try {
      await loadMicroAppDetails(dispatch, logout);
      updateState({ error: null });
    } catch (error) {
      console.error("Failed to load microapps:", error);
      updateState({ error: "Failed to load applications" });
    }
  }, [dispatch, updateState]);

  const handleRefresh = useCallback(async () => {
    updateState({ refreshing: true, error: null });
    try {
      await Promise.all([
        fetchDetailedUser(),
        loadApps()
      ]);
    } finally {
      updateState({ refreshing: false });
    }
  }, [fetchDetailedUser, loadApps, updateState]);

  const handleNotificationPress = useCallback(() => {
    console.log("Notifications pressed");
  }, []);

  const handleStorePress = useCallback(() => {
    router.push("/(tabs)/store" as any);
  }, []);

  const handleRetry = useCallback(() => {
    updateState({ error: null });
    handleRefresh();
  }, [handleRefresh, updateState]);

  // Effects
  useEffect(() => {
    if (!accessToken) {
      const timer = setTimeout(() => {
        router.replace(ScreenPaths.LOGIN);
      }, 100);
      return () => clearTimeout(timer);
    }

    const initializeScreen = async () => {
      try {
        await Promise.all([
          fetchDetailedUser(),
          loadApps()
        ]);
      } finally {
        updateState({ initialLoading: false });
      }
    };

    initializeScreen();
  }, [accessToken, fetchDetailedUser, loadApps, updateState]);

  // Render functions
  const renderMicroAppCard = useCallback(({ item }: { item: MicroApp }) => (
    <View style={styles.cardWrapper}>
      <MicroAppCard app={item} />
    </View>
  ), []);

  const renderAppsGrid = () => {
    if (downloadedApps.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="download-outline" size={48} color={Colors[colorScheme].icon} />
          <Text style={[styles.emptyStateText, { color: Colors[colorScheme].secondaryTextColor }]}>No apps downloaded yet</Text>
          <Text style={[styles.emptyStateSubtext, { color: Colors[colorScheme].ternaryTextColor }]}>
            Visit the store to download and install applications
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={downloadedApps}
        renderItem={renderMicroAppCard}
        keyExtractor={(item) => item.appId}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridContent}
        scrollEnabled={false}
      />
    );
  };

  // Loading state
  if (state.initialLoading && !userInfo) {
    return <LoadingState message="Loading your dashboard..." />;
  }

  // Error state
  if (state.error && !state.refreshing) {
    return (
      <ErrorState 
        message={state.error}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme].primaryBackgroundColor }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={state.refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.actionButtonTextColor}
            colors={[Colors.actionButtonTextColor]}
          />
        }
      >
        <HomeHeader
          userInfo={userInfo}
          loading={userInfoLoading}
          onNotificationPress={handleNotificationPress}
        />

        <View style={styles.content}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme].primaryTextColor }]}>Your Applications</Text>
            <TouchableOpacity 
              style={[styles.storeButton, { backgroundColor: Colors[colorScheme].ternaryBackgroundColor }]} 
              onPress={handleStorePress}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={20} color={Colors.actionButtonTextColor} />
              <Text style={[styles.storeButtonText, { color: Colors.actionButtonTextColor }]}>Store</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.appsContainer}>
            {renderAppsGrid()}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.ternaryBackgroundColor,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  storeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  storeButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  appsContainer: {
    flex: 1,
  },
  cardWrapper: {
    flex: 1,
    margin: 6,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  gridContent: {
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: "center",
  },
});
