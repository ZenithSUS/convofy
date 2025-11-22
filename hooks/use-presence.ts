"use client";

import showErrorConnectionMessage from "@/helper/pusher/error";
import { pusherClient } from "@/lib/pusher/pusher-client";
import ConnectionStatusHandler from "@/services/pusher/connection-status-handler";
import { useEffect, useMemo, useRef, useCallback } from "react";
import { useUpdateUserStatus } from "@/hooks/use-user";
import { Session } from "@/app/(views)/chat/components/chatpage/chat-header";
import getHomePusherConnectionState from "@/helper/pusher/home-connection-state";
import useConnectionStatus from "@/store/connection-status-store";
import useHybridSession from "./use-hybrid-session";

const useUserConnectionStatus = (serverSession: Session) => {
  const isMountedRef = useRef(false);
  const lastStatusRef = useRef<string | null>(null);
  const statusUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { session } = useHybridSession(serverSession);
  const userId = session?.user?.id;

  const { status: connectionStatus, setStatus: setConnectionStatus } =
    useConnectionStatus();

  const { mutateAsync: updateUserStatus } = useUpdateUserStatus();

  const conHandler = useMemo(
    () =>
      new ConnectionStatusHandler(
        isMountedRef,
        setConnectionStatus,
        getHomePusherConnectionState,
        showErrorConnectionMessage,
      ),
    [setConnectionStatus],
  );

  // Debounce status updates
  const updateStatus = useCallback(
    (status: string) => {
      if (!userId) return;

      // Clear any pending timeout
      if (statusUpdateTimeoutRef.current) {
        clearTimeout(statusUpdateTimeoutRef.current);
      }

      // Debounce status updates by 1 second
      statusUpdateTimeoutRef.current = setTimeout(async () => {
        if (!isMountedRef.current) return;

        try {
          await updateUserStatus({
            userId,
            status,
          });
          lastStatusRef.current = status;
        } catch (err) {
          console.error("Error updating user status:", err);
        }
      }, 1000);
    },
    [userId, updateUserStatus],
  );

  // Setup Pusher connection listeners
  useEffect(() => {
    if (!userId) return;

    isMountedRef.current = true;

    // Bind Pusher connection status handlers
    pusherClient.connection.bind("connected", conHandler.handleConnected);
    pusherClient.connection.bind("disconnected", conHandler.handleDisconnected);
    pusherClient.connection.bind("connecting", conHandler.handleConnecting);
    pusherClient.connection.bind("failed", conHandler.handleFailed);
    pusherClient.connection.bind("unavailable", conHandler.handleUnavailable);
    pusherClient.connection.bind("state_change", conHandler.handleStateChange);
    pusherClient.connection.bind("error", conHandler.handleError);

    // Set initial connection status
    const initialState = pusherClient.connection.state;
    setConnectionStatus(initialState);

    return () => {
      isMountedRef.current = false;

      // Unbind all handlers
      pusherClient.connection.unbind("error", conHandler.handleError);
      pusherClient.connection.unbind(
        "state_change",
        conHandler.handleStateChange,
      );
      pusherClient.connection.unbind("connecting", conHandler.handleConnecting);
      pusherClient.connection.unbind(
        "disconnected",
        conHandler.handleDisconnected,
      );
      pusherClient.connection.unbind("connected", conHandler.handleConnected);
      pusherClient.connection.unbind("failed", conHandler.handleFailed);
      pusherClient.connection.unbind(
        "unavailable",
        conHandler.handleUnavailable,
      );

      // Clear any pending timeouts
      if (statusUpdateTimeoutRef.current) {
        clearTimeout(statusUpdateTimeoutRef.current);
      }
    };
  }, [userId, conHandler, setConnectionStatus]);

  // Update user status when connection status changes
  useEffect(() => {
    if (!userId) return;

    const newStatus = connectionStatus === "connected" ? "online" : "offline";

    // Only update if status actually changed
    if (lastStatusRef.current !== newStatus) {
      updateStatus(newStatus);
    }
  }, [connectionStatus, userId, updateStatus]);

  return { connectionStatus };
};

export default useUserConnectionStatus;
