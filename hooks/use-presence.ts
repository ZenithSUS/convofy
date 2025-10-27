import showErrorConnectionMessage from "@/helper/pusher/error";
import { pusherClient } from "@/lib/pusher-client";
import ConnectionStatusHandler from "@/services/pusher/connection-status-handler";
import { useEffect, useMemo, useRef } from "react";
import { useUpdateUserStatus } from "@/hooks/use-user";
import { Session } from "@/app/(views)/chat/components/chat-header";
import getHomePusherConnectionState from "@/helper/pusher/home-connection-state";
import useConnectionStatus from "@/store/connection-status-store";
import useHybridSession from "./use-hybrid-session";

const useUserConnectionStatus = (serverSession: Session) => {
  const isMountedRef = useRef(false);

  const { session } = useHybridSession(serverSession);
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

  useEffect(() => {
    if (!session) return;

    // Pusher connection status handler
    pusherClient.connection.bind("connected", conHandler.handleConnected);
    pusherClient.connection.bind("disconnected", conHandler.handleDisconnected);
    pusherClient.connection.bind("connecting", conHandler.handleConnecting);
    pusherClient.connection.bind("failed", conHandler.handleFailed);
    pusherClient.connection.bind("unavailable", conHandler.handleUnavailable);
    pusherClient.connection.bind("state_change", conHandler.handleStateChange);
    pusherClient.connection.bind("error", conHandler.handleError);

    const initialState = pusherClient.connection.state;
    setConnectionStatus(initialState);

    return () => {
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
  }, [
    session,
    conHandler.handleStateChange,
    conHandler.handleError,
    conHandler.handleConnecting,
    conHandler.handleDisconnected,
    conHandler.handleConnected,
    conHandler.handleFailed,
    conHandler.handleUnavailable,
    setConnectionStatus,
  ]);

  useEffect(() => {
    if (!session.user.id) return;

    const getUserStatus = async () => {
      return await updateUserStatus({
        userId: session.user.id,
        status: connectionStatus !== "connected" ? "offline" : "online",
      }).catch((err) => console.error("Error updating user status:", err));
    };

    getUserStatus();
  }, [connectionStatus, session.user.id, updateUserStatus]);

  return { connectionStatus };
};

export default useUserConnectionStatus;
