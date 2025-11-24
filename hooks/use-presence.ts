"use client";

import showErrorConnectionMessage from "@/helper/pusher/error";
import { pusherClient } from "@/lib/pusher/pusher-client";
import ConnectionStatusHandler from "@/services/pusher/connection-status-handler";
import { useEffect, useMemo, useRef } from "react";
import { Session } from "@/app/(views)/chat/components/chatpage/chat-header";
import getHomePusherConnectionState from "@/helper/pusher/home-connection-state";
import useConnectionStatus from "@/store/connection-status-store";
import useHybridSession from "./use-hybrid-session";

const useUserConnectionStatus = (serverSession: Session) => {
  const isMountedRef = useRef(false);

  const { session } = useHybridSession(serverSession);
  const userId = session?.user?.id;

  const { status: connectionStatus, setStatus: setConnectionStatus } =
    useConnectionStatus();

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
    };
  }, [userId, conHandler, setConnectionStatus]);

  return { connectionStatus };
};

export default useUserConnectionStatus;
