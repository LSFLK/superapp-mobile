/**
 * MicroAppIcon Component
 * 
 * Displays micro-app icons with fallback to default icons
 * Supports both remote images and fallback Ionicons
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

interface MicroAppIconProps {
  iconUrl?: string;
  appId: string;
  size?: number;
  color?: string;
  style?: any;
}

export const MicroAppIcon: React.FC<MicroAppIconProps> = ({
  iconUrl,
  appId,
  size = 32,
  color = '#2563EB',
  style
}) => {
  const [imageError, setImageError] = useState(false);

  const getFallbackIcon = (appId: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      'payslip-viewer': 'document-text-outline',
      'leave-management': 'calendar-outline',
      'tax-filing': 'cash-outline',
      'hr-portal': 'people-outline',
      'attendance': 'time-outline',
      'expense-tracker': 'card-outline',
      'training': 'school-outline',
      'directory': 'book-outline',
      'news': 'newspaper-outline',
      'settings': 'settings-outline',
    };
    
    return iconMap[appId] || 'apps-outline';
  };

  const containerStyle = [
    styles.container,
    { width: size + 8, height: size + 8 },
    style
  ];

  // If we have an iconUrl and no error, try to load the image
  if (iconUrl && !imageError) {
    return (
      <View style={containerStyle}>
        <Image
          source={{ uri: iconUrl }}
          style={[styles.image, { width: size, height: size }]}
          contentFit="contain"
          transition={200}
          onError={() => {
            console.log(`Failed to load icon for ${appId}:`, iconUrl);
            setImageError(true);
          }}
        />
      </View>
    );
  }

  // Fallback to Ionicon
  return (
    <View style={containerStyle}>
      <Ionicons 
        name={getFallbackIcon(appId)} 
        size={size} 
        color={color} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    borderRadius: 8,
  },
});