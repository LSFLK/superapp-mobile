/**
 * UserAvatar Component
 * 
 * Displays user avatar with fallback to initials
 * Supports both remote images and fallback text
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

interface UserAvatarProps {
  imageUrl?: string | null;
  fallbackText: string;
  size?: number;
  style?: any;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  imageUrl,
  fallbackText,
  size = 48,
  style
}) => {
  const avatarStyle = [
    styles.avatar,
    { width: size, height: size, borderRadius: size / 2 },
    style
  ];

  const textStyle = [
    styles.avatarText,
    { fontSize: size * 0.4 }
  ];

  if (imageUrl) {
    return (
      <View style={avatarStyle}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.avatarImage}
          contentFit="cover"
          placeholder={fallbackText}
          transition={200}
          onError={() => {
            // Fallback to text avatar on image load error
            console.log('Failed to load user avatar:', imageUrl);
          }}
        />
        {/* Fallback text overlay in case image fails to load */}
        <View style={styles.fallbackOverlay}>
          <Text style={textStyle}>
            {fallbackText.charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[avatarStyle, styles.fallbackAvatar]}>
      <Text style={textStyle}>
        {fallbackText.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  fallbackOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  fallbackAvatar: {
    backgroundColor: '#2563EB',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});