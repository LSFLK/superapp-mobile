/**
 * LoadingState Component
 * 
 * Reusable loading component with customizable appearance
 */

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

interface LoadingStateProps {
  size?: 'small' | 'large';
  message?: string;
  style?: any;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  size = 'large',
  message = 'Loading...',
  style
}) => {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color="#2563EB" />
      {message && (
        <Text style={styles.message}>{message}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});