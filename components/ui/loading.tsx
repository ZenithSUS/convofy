"use client";

import { ThreeDot } from "react-loading-indicators";
import { useTheme } from "../providers/theme-provider";

function Loading({ text }: { text?: string }) {
  const { isDarkMode } = useTheme();
  return (
    <ThreeDot
      variant="bounce"
      color="#3b6eceff"
      size="medium"
      text={text || "Loading..."}
      textColor={isDarkMode ? "#ffffff" : "#000000"}
    />
  );
}

export default Loading;
