"use client";

import { Button } from "@/components/ui/button";
import { PusherConnectionStatus } from "@/types/pusher";
import { AlertCircle, RefreshCw, WifiOff } from "lucide-react";

interface ConnectionStatusProps {
  connectionStatus: PusherConnectionStatus | string;
}

function ConnectionStatus({ connectionStatus }: ConnectionStatusProps) {
  return (
    <div
      className={`flex items-center justify-between border-l-4 px-6 py-3 shadow-sm ${
        connectionStatus === "failed"
          ? "border-red-500 bg-red-50 text-red-800 dark:border-rose-400 dark:bg-rose-50 dark:text-rose-800"
          : connectionStatus === "unavailable"
            ? "border-orange-500 bg-orange-50 text-orange-800 dark:border-amber-400 dark:bg-amber-50 dark:text-amber-800"
            : "border-yellow-500 bg-yellow-50 text-yellow-800 dark:border-amber-400 dark:bg-amber-50 dark:text-amber-800"
      }`}
    >
      <div className="flex items-center gap-3">
        {connectionStatus === "failed" ? (
          <WifiOff size={20} />
        ) : (
          <AlertCircle size={20} />
        )}
        <div>
          <p className="text-sm font-semibold">
            {connectionStatus === "connecting" && "Connecting to chat..."}
            {connectionStatus === "disconnected" && "Connection Lost"}
            {connectionStatus === "unavailable" && "Network Unavailable"}
            {connectionStatus === "failed" && "Connection Failed"}
            {connectionStatus === "error" && "Connection Error"}
          </p>
          <p className="text-xs opacity-90">
            {connectionStatus === "connecting" && "Please wait"}
            {connectionStatus === "disconnected" &&
              "Attempting to reconnect..."}
            {connectionStatus === "unavailable" &&
              "Check your internet connection"}
            {connectionStatus === "failed" && "Please refresh the page"}
            {connectionStatus === "error" && "Retrying connection..."}
          </p>
        </div>
      </div>
      {connectionStatus === "failed" && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => window.location.reload()}
          className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <RefreshCw size={16} className="mr-1" />
          Refresh
        </Button>
      )}
    </div>
  );
}

export default ConnectionStatus;
