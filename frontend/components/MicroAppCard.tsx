/**
 * MicroAppCard Component
 *
 * Displays individual micro-app cards in a grid layout with icons, names, and status indicators.
 * Handles user interaction for launching micro-apps and provides visual feedback for different app states.
 */

import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '@/context/store';
import { MicroApp, markAppAsViewed } from '@/context/slices/appSlice';
import { DOWNLOADED } from '@/constants/Constants';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MicroAppIcon } from './MicroAppIcon';
const { width } = Dimensions.get("window");

interface MicroAppCardProps {
  app: MicroApp; // Micro-app data object
  onPress?: (app: MicroApp) => void; // Optional custom press handler
}

export const MicroAppCard: React.FC<MicroAppCardProps> = ({
  app,
  onPress
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const colorScheme = useColorScheme() ?? "light";
  const { accessToken } = useSelector((state: RootState) => state.auth);
  const { userInfo } = useSelector((state: RootState) => state.userInfo);

  // Determine app availability states
  const isDownloaded = app.status === DOWNLOADED;
  const isAvailable = isDownloaded && app.webViewUri;

  /**
   * Check if app was recently downloaded (within last 24 hours)
   * Used to show "Ready" badge and determine if app should be marked as viewed
   */
  const isNewlyDownloaded = (() => {
    if (!app.downloadedAt || !isDownloaded) return false;
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    return app.downloadedAt > twentyFourHoursAgo;
  })();

  /**
   * Handle card press - either use custom handler or navigate to micro-app
   *
   * Flow:
   * - If custom onPress provided, delegate to it
   * - If app is available: mark as viewed (removes "Ready" badge) and navigate
   * - If app unavailable: show alert directing to store
   */
  const handlePress = () => {
    if (onPress) {
      onPress(app);
      return;
    }

    if (isAvailable) {
      // Mark app as viewed to remove "Ready" badge
      if (isNewlyDownloaded) {
        dispatch(markAppAsViewed({ appId: app.app_id }));
      }

      router.push({
        pathname: "/micro-app",
        params: {
          appId: app.app_id,
          appName: app.name,
          webViewUri: app.webViewUri,
          empID: userInfo?.employeeID || "",
        },
      });
    } else {
      Alert.alert(
        "App not available",
        "This app needs to be downloaded first. Go to the Store tab to install it.",
        [{ text: "OK" }]
      );
    }
  };

  /**
   * Render the micro-app card with icon, name, and status indicators
   *
   * Card shows different visual states:
   * - Normal: Available app with full opacity
   * - Disabled: Unavailable app with reduced opacity
   * - Badge: "Ready" indicator for newly downloaded apps
   */
  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: Colors[colorScheme].secondaryBackgroundColor, },
        !isAvailable && styles.cardDisabled
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* App icon container with shadow and background */}
      <View style={[
        styles.iconContainer,
        { backgroundColor: Colors[colorScheme].overLayColor, shadowColor: Colors[colorScheme].overLayColor, elevation: 10 },
        !isAvailable && styles.iconContainerDisabled,
      ]}>
        <MicroAppIcon
          iconUrl={app.icon_url}
          appId={app.app_id}
          size={32}
          color={isAvailable ? Colors.actionButtonTextColor : Colors[colorScheme].icon}
        />
      </View>

      {/* App name with conditional styling based on availability */}
      <Text
        style={[
          styles.appName,
          { color: Colors[colorScheme].primaryTextColor },
          !isAvailable && { color: Colors[colorScheme].icon }
        ]}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {app.name}
      </Text>

      {/* "Ready" badge shown only for newly downloaded apps */}
      {isNewlyDownloaded && (
        <View style={[styles.badge, { backgroundColor: Colors.actionButtonTextColor }]}>
          <Ionicons name="checkmark-circle" size={12} color="#FFFFFF" />
          <Text style={styles.badgeText}>Ready</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Main card container - responsive width for 3-column grid
  card: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: (width - 20 * 4) / 3, // Calculate width for 3 cards with margins
    height: 140,
  },
  // Disabled state styling - reduces opacity
  cardDisabled: {
    opacity: 0.6,
  },
  // Icon container with shadow and background
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  // Further reduce opacity for disabled icon
  iconContainerDisabled: {
    opacity: 0.5,
  },
  // App name text styling
  appName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
    flex: 1,
  },
  // "Ready" badge container
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  // Badge text styling
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
});