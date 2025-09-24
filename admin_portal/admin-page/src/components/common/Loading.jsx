/**
 * Loading Component
 * 
 * A standardized loading indicator component that provides consistent
 * visual feedback during asynchronous operations. Ensures uniform
 * loading states across the admin portal.
 * 
 * Features:
 * - Consistent loading message styling
 * - Customizable loading text
 * - Theme-integrated colors
 * - Flexible styling options
 * 
 * Props:
 * @param {string} message - Loading message to display (default: 'Loading...')
 * @param {Object} style - Additional CSS styles to merge with defaults
 * 
 * Usage:
 * <Loading />
 * <Loading message="Fetching micro-apps..." />
 * <Loading message="Uploading file..." style={{ fontSize: '16px' }} />
 * 
 * Common Use Cases:
 * - API request loading states
 * - File upload progress indication
 * - Page content loading
 * - Component initialization loading
 */

import React from 'react';
import { COMMON_STYLES } from '../../constants/styles';

const Loading = ({ message = 'Loading...', style = {} }) => {
  return (
    <div style={{ 
      ...COMMON_STYLES.loadingText, // Apply theme loading text styles
      ...style                      // Merge any custom styling
    }}>
      {message}
    </div>
  );
};

export default Loading;
