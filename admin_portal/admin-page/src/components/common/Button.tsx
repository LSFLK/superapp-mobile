/**
 * Reusable Button Component
 *
 * A standardized button component that ensures consistent styling and behavior
 * across the admin portal. Includes accessibility features and theming support.
 */

import React from "react";
import { COMMON_STYLES } from "../../constants/styles";

type ButtonVariant = "primary" | "secondary";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  variant?: ButtonVariant;
  style?: React.CSSProperties;
};

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  variant = "primary",
  style = {},
  ...props
}) => {
  // Merge base styles with variant-specific styling
  const baseStyle: React.CSSProperties = {
    ...COMMON_STYLES.button,
    backgroundColor: variant === "primary" ? "#1677ff" : "#f0f0f0",
    color: variant === "primary" ? "white" : "#262626",
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? "not-allowed" : "pointer",
    ...style,
  };

  const handleFocus: React.FocusEventHandler<HTMLButtonElement> = (e) => {
    if (!disabled) {
      e.currentTarget.style.boxShadow = (
        COMMON_STYLES as any
      ).buttonFocus.boxShadow;
    }
  };

  const handleBlur: React.FocusEventHandler<HTMLButtonElement> = (e) => {
    e.currentTarget.style.boxShadow = "none";
  };

  return (
    <button
      style={baseStyle}
      onClick={disabled ? undefined : onClick}
      onFocus={handleFocus}
      onBlur={handleBlur}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
