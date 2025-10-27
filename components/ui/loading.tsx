"use client";

import { ThreeDot } from "react-loading-indicators";

function Loading({ text }: { text?: string }) {
  return (
    <ThreeDot
      variant="bounce"
      color="#31a1cc"
      size="medium"
      text={text || "Loading..."}
      textColor="#000000"
    />
  );
}

export default Loading;
