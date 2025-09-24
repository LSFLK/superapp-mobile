/**
 * Admin Portal Style Constants
 * 
 * This file centralizes all styling constants used throughout the admin portal
 * to ensure consistent theming, colors, and component styling.
 * 
 * Benefits:
 * - Single source of truth for design tokens
 * - Easy theme customization and maintenance  
 * - Consistent styling across all components
 * - Better accessibility through standardized colors
 */

/**
 * Color Palette
 * 
 * Defines the core color scheme for the admin portal.
 * Based on a professional blue theme suitable for administrative interfaces.
 */
export const COLORS = {
  // Primary brand colors
  primary: '#003a67',      // Dark blue for headings and primary elements
  secondary: '#09589c',    // Medium blue for secondary elements and loading states
  
  // Background and surface colors
  background: '#f9fcff',   // Light blue-tinted background for cards and surfaces
  border: '#e3f2ff',       // Subtle border color for component separation
  cardBackground: '#f5faff', // Slightly different background for card components
  
  // Status and feedback colors
  error: '#b91c1c',        // Red for error messages and alerts
  warning: '#d97706',      // Orange for warning messages
  success: '#059669',      // Green for success states and confirmations
  
  // Text colors
  text: '#262626',         // Primary text color for good readability
  textMuted: '#8c8c8c'     // Muted text color for secondary information
};

/**
 * Common Style Objects
 * 
 * Pre-defined style objects that can be reused across components.
 * These styles implement the design system consistently and reduce code duplication.
 */
export const COMMON_STYLES = {
  /**
   * Greeting message styling for authenticated users
   * Positioned to work with the sidebar layout
   */
  greeting: {
    textAlign: 'center',
    marginLeft: '330px',     // Account for sidebar width (240px + padding)
    marginTop: '1px',
    marginBottom: '20px',
    fontSize: '24px',
    fontWeight: '500',
    color: COLORS.primary
  },
  
  /**
   * Standard card component styling
   * Used for content containers throughout the application
   */
  card: {
    background: COLORS.cardBackground,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 4px 12px -2px rgba(0,58,103,0.08)' // Subtle shadow for depth
  },
  
  /**
   * Standard button styling with accessibility features
   * Includes focus states and smooth transitions
   */
  button: {
    border: 'none',
    outline: 'none',
    boxShadow: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease' // Smooth hover and focus transitions
  },
  
  /**
   * Focus state styling for interactive elements
   * Provides clear visual feedback for keyboard navigation
   */
  buttonFocus: {
    boxShadow: '0 0 0 3px rgba(24,144,255,0.35)' // Blue focus ring for accessibility
  },
  
  /**
   * Main content section styling
   * Used for page content areas within the admin portal
   */
  section: {
    marginTop: '60px',       // Space for fixed greeting
    background: '#ffffff',   // Pure white for content readability
    border: '1px solid rgb(208, 236, 255)', // Light blue border
    borderRadius: '16px',
    padding: '20px'
  },
  
  /**
   * Loading state text styling
   * Consistent styling for loading indicators
   */
  loadingText: {
    color: COLORS.secondary,
    marginBottom: '12px'
  },
  
  /**
   * Error message styling
   * Clear visual indication of error states
   */
  errorText: {
    color: COLORS.error,
    marginBottom: '12px'
  }
};
