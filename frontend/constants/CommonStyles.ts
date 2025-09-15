import { StyleSheet } from 'react-native';

// Common style constants that can be reused across components
export const CommonStyles = {
  // Shadow styles
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  largeShadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  
  // Border radius
  borderRadius: {
    small: 8,
    medium: 12,
    large: 16,
    extraLarge: 20,
  },
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 40,
  },
  
  // Typography
  typography: {
    // Headers
    headerLarge: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 40,
    },
    headerMedium: {
      fontSize: 24,
      fontWeight: '600' as const,
      lineHeight: 30,
    },
    headerSmall: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 26,
    },
    
    // Body text
    bodyLarge: {
      fontSize: 16,
      lineHeight: 24,
    },
    bodyMedium: {
      fontSize: 14,
      lineHeight: 20,
    },
    bodySmall: {
      fontSize: 12,
      lineHeight: 18,
    },
    
    // Emphasis
    semiBold: {
      fontWeight: '600' as const,
    },
    bold: {
      fontWeight: '700' as const,
    },
  },
  
  // Common container styles
  containers: {
    page: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    card: {
      borderRadius: 16,
      padding: 24,
    },
    section: {
      marginBottom: 24,
    },
    header: {
      marginBottom: 24,
      paddingBottom: 16,
    },
  },
  
  // Button styles
  buttons: {
    primary: {
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    secondary: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
  },
};

// Helper function to create consistent card styles with theme colors
export const createCardStyle = (backgroundColor: string) => ({
  ...CommonStyles.containers.card,
  backgroundColor,
  ...CommonStyles.cardShadow,
});

// Helper function to create consistent header styles
export const createHeaderStyle = (borderColor: string) => ({
  ...CommonStyles.containers.header,
  borderBottomWidth: 1,
  borderBottomColor: borderColor,
});