/**
 * Reusable Card Component
 * 
 * A standardized container component that provides consistent styling for
 * content sections throughout the admin portal. Implements the design system's
 * card styling with proper spacing, borders, and shadows.
 * 
 * Features:
 * - Consistent card styling across the application
 * - Customizable through style props and className
 * - Accessible and semantic container structure
 * - Integration with the design system theme
 * 
 * Props:
 * @param {React.ReactNode} children - Content to render inside the card
 * @param {Object} style - Additional CSS styles to merge with defaults
 * @param {string} className - Additional CSS class names to apply
 * 
 * Usage:
 * <Card>
 *   <h3>Card Title</h3>
 *   <p>Card content goes here...</p>
 * </Card>
 * 
 * <Card style={{ maxWidth: '400px' }} className="special-card">
 *   Custom styled card
 * </Card>
 */

import React from 'react';
import { COMMON_STYLES } from '../../constants/styles';

const Card = ({ children, style = {}, className = '' }) => {
  return (
    <div 
      className={`card ${className}`} // Combine default and custom classes
      style={{
        ...COMMON_STYLES.card, // Apply design system card styles
        ...style              // Merge any custom overrides
      }}
    >
      {children}
    </div>
  );
};

export default Card;
