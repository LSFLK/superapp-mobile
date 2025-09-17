/**
 * ErrorState Component
 * 
 * Reusable error component with retry functionality
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  style?: any;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Something went wrong',
  onRetry,
  style
}) => {
  return (
    <View style={[styles.container, style]}>
      <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
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
    marginBottom: 20,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});