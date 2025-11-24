"use client";

import { Button } from "@/components/ui/button";
import { AxiosError } from "axios/";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface RoomErrorProps {
  roomErrorData: unknown;
  handleRefresh: () => void;
}

function RoomError({ roomErrorData, handleRefresh }: RoomErrorProps) {
  const router = useRouter();

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-linear-to-br from-gray-50 via-white to-gray-50 p-4 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="w-full max-w-md rounded-2xl border-2 border-red-100 bg-white p-8 shadow-xl dark:border-red-900/30 dark:bg-gray-800">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-50 p-4 dark:bg-red-950/50">
            <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400" />
          </div>
        </div>

        <h2 className="mb-3 text-center text-2xl font-bold text-gray-900 dark:text-gray-100">
          Unable to Load Room
        </h2>

        <p className="mb-6 text-center text-gray-600 dark:text-gray-400">
          {roomErrorData instanceof AxiosError
            ? roomErrorData.response?.data?.message ||
              roomErrorData.message ||
              "The room you're trying to access could not be loaded."
            : "An unexpected error occurred while loading this room."}
        </p>

        <div className="space-y-3">
          <Button
            onClick={handleRefresh}
            className="w-full bg-blue-600 text-white transition-all duration-300 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Try Again
          </Button>

          <Button
            onClick={() => router.back()}
            variant="outline"
            className="w-full border-2 border-gray-200 transition-all duration-300 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600"
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}

export default RoomError;
