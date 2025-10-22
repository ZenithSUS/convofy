import getPusherConnectionState from "@/helper/pusher-connection-state";
import showErrorConnectionMessage from "@/helper/pusher-error";
import { pusherClient } from "@/lib/pusher-client";
import ConnectionStatusHandler from "@/services/pusher/connection-status-handler";
import { PusherChannel, PusherConnectionStatus } from "@/types/pusher";

import { useEffect, useMemo, useRef, useState } from "react";
import { useUpdateUserStatus } from "@/hooks/use-user";
import { Session } from "@/app/(views)/chat/components/chat-header";

interface userConnectionStatusProps {
  session: Session;
}

const useUserConnectionStatus = ({ session }: userConnectionStatusProps) => {
  const channelRef = useRef<PusherChannel | null>(null);
  const isMountedRef = useRef(false);

  const [connectionStatus, setConnectionStatus] = useState<
    PusherConnectionStatus | string
  >("connecting");

  const { mutateAsync: updateUserStatus } = useUpdateUserStatus();

  const conHandler = useMemo(
    () =>
      new ConnectionStatusHandler(
        isMountedRef,
        setConnectionStatus,
        getPusherConnectionState,
        showErrorConnectionMessage,
      ),
    [],
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
  ]);

  useEffect(() => {
    if (!session.user.id) return;

    const getUserStatus = async () => {
      return connectionStatus !== "connected"
        ? await updateUserStatus({
            userId: session.user.id,
            status: "offline",
          })
        : await updateUserStatus({
            userId: session.user.id,
            status: "online",
          });
    };

    getUserStatus();
  }, [connectionStatus, session.user.id, updateUserStatus]);

  useEffect(() => {
    isMountedRef.current = true;
    const cleanupChannel = () => {
      if (channelRef.current) {
        console.log("Cleaning up channel", channelRef.current.name);
        const channelName = channelRef.current.name;
        channelRef.current.unbind_all();
        try {
          pusherClient.unsubscribe(channelName);
        } catch (error) {
          console.error("Error unsubscribing from channel:", error);
        }
        channelRef.current = null;
      }
    };
    if (!session.user.id) {
      cleanupChannel();
      return;
    }

    const channelName = `user-${session.user.id}`;

    if (!channelRef.current || channelRef.current.name !== channelName) {
      const existingChannel = pusherClient.channel(channelName);
      if (existingChannel) {
        existingChannel.unbind_all();
        pusherClient.unsubscribe(channelName);
      }

      const channel = pusherClient.subscribe(channelName);
      channelRef.current = channel;

      channel.bind("status-update", (data: string) => {
        console.log("Status update:", data);
      });
    }

    return () => {
      isMountedRef.current = false;
      cleanupChannel();
    };
  }, [session.user.id]);

  return { connectionStatus };
};

export default useUserConnectionStatus;
