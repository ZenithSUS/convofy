"use client";

import Loading from "@/components/ui/loading";

function LoadingConvo({ theme }: { theme: string }) {
  return (
    <div className="flex h-screen items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 dark:bg-linear-to-br dark:from-gray-800 dark:to-gray-900">
      <div className="flex flex-col items-center gap-4">
        <Loading theme={theme} />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Loading conversation...
        </p>
      </div>
    </div>
  );
}

export default LoadingConvo;
