"use client";

import { Button } from "@/components/ui/button";
import { LockIcon } from "lucide-react";
import { useRouter } from "next/navigation";

function DeniedPageClient() {
  const router = useRouter();

  return (
    <div className="flex h-screen items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 dark:bg-linear-to-br dark:from-gray-800 dark:to-gray-900">
      <div className="flex flex-col items-center gap-4 rounded-md border-2 border-gray-200 bg-gray-100 p-5 shadow-xl dark:border-gray-700 dark:bg-gray-800">
        <h1 className="text-center text-3xl font-bold text-gray-800 dark:text-gray-100">
          Access Denied
        </h1>

        <LockIcon className="h-15 w-15 text-gray-800 dark:text-gray-100" />

        <p className="text-center text-gray-600 dark:text-gray-400">
          You don&apos;t have permission to access this page
        </p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    </div>
  );
}

export default DeniedPageClient;
