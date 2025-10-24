/**
 * Reusable Card Component
 *
 * A standardized container component that provides consistent styling for
 * content sections throughout the admin portal. Implements the design system's
 * card styling with proper spacing, borders, and shadows.
 */

import React from "react";
import { COMMON_STYLES } from "../../constants/styles";

export type CardProps = {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
};

const Card: React.FC<CardProps> = ({
  children,
  style = {},
  className = "",
}) => {
  return (
    <div
      className={`card ${className}`}
      style={{
        // Apply design system card styles first, allow custom overrides to win
        ...(COMMON_STYLES.card as React.CSSProperties),
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default Card;
