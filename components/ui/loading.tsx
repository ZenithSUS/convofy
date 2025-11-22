"use client";

import { ThreeDot } from "react-loading-indicators";

function Loading({ text, theme }: { text?: string; theme?: string }) {
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
