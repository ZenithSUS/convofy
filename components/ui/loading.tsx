"use client";

import { ThreeDot } from "react-loading-indicators";
import useTheme from "@/store/theme-store";

function Loading({ text }: { text?: string }) {
  const { theme } = useTheme();
  return (
    <ThreeDot
      variant="bounce"
      color="#3b6eceff"
      size="medium"
      text={text || "Loading..."}
      textColor={theme === "dark" ? "#ffffff" : "#000000"}
    />
  );
}

export default Loading;
