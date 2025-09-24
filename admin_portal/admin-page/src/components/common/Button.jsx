/**
 * Reusable Button Component
 * 
 * A standardized button component that ensures consistent styling and behavior
 * across the admin portal. Includes accessibility features and theming support.
 * 
 * Features:
 * - Consistent styling with theme integration
 * - Accessibility-compliant focus states
 * - Multiple variants (primary, secondary)
 * - Disabled state handling
 * - Smooth transitions and hover effects
 * 
 * Props:
 * @param {React.ReactNode} children - Button content (text, icons, etc.)
 * @param {Function} onClick - Click event handler
 * @param {boolean} disabled - Whether button is disabled (default: false)
 * @param {string} variant - Button variant: 'primary' | 'secondary' (default: 'primary')
 * @param {Object} style - Additional custom styles to merge
 * @param {...Object} props - Additional props passed to button element
 * 
 * Usage:
 * <Button onClick={handleClick}>Save Changes</Button>
 * <Button variant="secondary" disabled={loading}>Cancel</Button>
 */

import React from 'react';
import { COMMON_STYLES } from '../../constants/styles';

const Button = ({ 
  children, 
  onClick, 
  disabled = false, 
  variant = 'primary',
  style = {},
  ...props 
}) => {
  // Merge base styles with variant-specific styling
  const baseStyle = {
    ...COMMON_STYLES.button,
    // Variant-specific colors
    backgroundColor: variant === 'primary' ? '#1677ff' : '#f0f0f0',
    color: variant === 'primary' ? 'white' : '#262626',
    // Disabled state styling
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    // Merge any custom styles
    ...style
  };

  /**
   * Focus Event Handler
   * 
   * Applies accessibility-compliant focus styling when button receives focus.
   * Only applies focus ring for non-disabled buttons to avoid confusion.
   */
  const handleFocus = (e) => {
    if (!disabled) {
      e.currentTarget.style.boxShadow = COMMON_STYLES.buttonFocus.boxShadow;
    }
  };

  /**
   * Blur Event Handler
   * 
   * Removes focus styling when button loses focus.
   */
  const handleBlur = (e) => {
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <button
      style={baseStyle}
      onClick={disabled ? undefined : onClick} // Prevent clicks when disabled
      onFocus={handleFocus}
      onBlur={handleBlur}
      disabled={disabled}
      {...props} // Spread additional props (aria-*, data-*, etc.)
    >
      {children}
    </button>
  );
};

export default Button;
