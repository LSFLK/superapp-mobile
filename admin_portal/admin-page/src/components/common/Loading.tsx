/**
 * Loading Component
 */
import React from "react";
import { COMMON_STYLES } from "../../constants/styles";

export type LoadingProps = {
  message?: string;
  style?: React.CSSProperties;
};

const Loading: React.FC<LoadingProps> = ({
  message = "Loading...",
  style = {},
}) => {
  return (
    <div
      style={{
        ...COMMON_STYLES.loadingText,
        ...style,
      }}
    >
      {message}
    </div>
  );
};

export default Loading;
