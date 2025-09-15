/**
 * MicroAppCard Component
 * 
 * Reusable card component for displaying micro-apps
 * Handles navigation, loading states, and visual feedback
 */

import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '@/context/store';
import { MicroApp, markAppAsViewed } from '@/context/slices/appSlice';
import { DOWNLOADED } from '@/constants/Constants';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MicroAppIcon } from './MicroAppIcon';

interface MicroAppCardProps {
  app: MicroApp;
  onPress?: (app: MicroApp) => void;
}

export const MicroAppCard: React.FC<MicroAppCardProps> = ({ 
  app, 
  onPress 
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const colorScheme = useColorScheme() ?? "light";
  const { accessToken } = useSelector((state: RootState) => state.auth);
  const { userInfo } = useSelector((state: RootState) => state.userInfo);

  const isDownloaded = app.status === DOWNLOADED;
  const isAvailable = isDownloaded && app.webViewUri;
  
  // Check if app was recently downloaded (within last 24 hours)
  const isNewlyDownloaded = (() => {
    if (!app.downloadedAt || !isDownloaded) return false;
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    return app.downloadedAt > twentyFourHoursAgo;
  })();

  const handlePress = () => {
    if (onPress) {
      onPress(app);
      return;
    }

    if (isAvailable) {
      // Mark app as viewed to remove "Ready" badge
      if (isNewlyDownloaded) {
        dispatch(markAppAsViewed({ appId: app.appId }));
      }
      
      router.push({
        pathname: "/micro-app",
        params: {
          appId: app.appId,
          appName: app.name,
          webViewUri: app.webViewUri,
          clientId: app.clientId || "default-client-id",
          exchangedToken: accessToken || "",
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

  return (
    <TouchableOpacity 
      style={[
        styles.card,
        { backgroundColor: Colors[colorScheme].secondaryBackgroundColor },
        !isAvailable && styles.cardDisabled
      ]} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[
        styles.iconContainer, 
        { backgroundColor: Colors[colorScheme].overLayColor },
        !isAvailable && styles.iconContainerDisabled,
      ]}>
        <MicroAppIcon
          iconUrl={app.iconUrl}
          appId={app.appId}
          size={32}
          color={isAvailable ? Colors.actionButtonTextColor : Colors[colorScheme].icon}
        />
      </View>
      
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
  card: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardDisabled: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainerDisabled: {
    opacity: 0.5,
  },
  appName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
    flex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
});