"use client";

import Loading from "@/components/ui/loading";

function LoadingConvo() {
  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex flex-col items-center gap-4">
        <Loading />
        <p className="text-sm text-gray-600">Loading conversation...</p>
      </div>
    </div>
  );
}

export default LoadingConvo;
