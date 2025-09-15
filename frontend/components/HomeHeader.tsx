/**
 * HomeHeader Component
 * 
 * Reusable header component for the home screen
 * Displays user information, greeting, and notifications
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserAvatar } from './UserAvatar';
import { UserInfo } from '@/context/slices/userInfoSlice';
import { getTimeOfDay } from '@/utils/timeofDay';

interface HomeHeaderProps {
  userInfo: UserInfo | null;
  loading?: boolean;
  onNotificationPress?: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  userInfo,
  loading = false,
  onNotificationPress
}) => {
  const getDisplayName = (): string => {
    if (loading) return "Loading...";
    if (!userInfo) return "Guest User";
    return `${userInfo.firstName} ${userInfo.lastName || ''}`.trim();
  };

  const getDepartment = (): string => {
    if (loading || !userInfo) return "";
    return userInfo.department || userInfo.ministry || "";
  };

  const getAvatarFallback = (): string => {
    if (!userInfo) return "G";
    return userInfo.firstName || "U";
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <UserAvatar
          imageUrl={userInfo?.employeeThumbnail}
          fallbackText={getAvatarFallback()}
          size={48}
          style={styles.avatar}
        />
        
        <View style={styles.textContainer}>
          <Text style={styles.greeting}>
            Good {getTimeOfDay()}
          </Text>
          <Text style={styles.userName} numberOfLines={1}>
            {getDisplayName()}
          </Text>
          <Text style={styles.department} numberOfLines={1}>
            {getDepartment()}
          </Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.notificationButton}
        onPress={onNotificationPress}
        activeOpacity={0.7}
      >
        <Ionicons name="notifications-outline" size={24} color="#1E293B" />
        <View style={styles.notificationBadge} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  department: {
    fontSize: 14,
    color: '#6B7280',
  },
  notificationButton: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    backgroundColor: '#EF4444',
    borderRadius: 4,
  },
});