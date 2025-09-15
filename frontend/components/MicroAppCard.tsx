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
        !isAvailable && styles.cardDisabled
      ]} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[
        styles.iconContainer, 
        !isAvailable && styles.iconContainerDisabled,
      ]}>
        <MicroAppIcon
          iconUrl={app.iconUrl}
          appId={app.appId}
          size={32}
          color={isAvailable ? "#2563EB" : "#9CA3AF"}
        />
      </View>
      
      <Text 
        style={[
          styles.appName, 
          !isAvailable && styles.appNameDisabled
        ]}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {app.name}
      </Text>
      
      {isNewlyDownloaded && (
        <View style={styles.badge}>
          <Ionicons name="checkmark-circle" size={12} color="#FFFFFF" />
          <Text style={styles.badgeText}>Ready</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainerDisabled: {
    backgroundColor: '#F9FAFB',
  },
  appName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 18,
    flex: 1,
  },
  appNameDisabled: {
    color: '#9CA3AF',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
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