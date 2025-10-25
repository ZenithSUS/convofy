"use client";

import showErrorConnectionMessage from "@/helper/pusher/error";
import getHomePusherConnectionState from "@/helper/pusher/home-connection-state";
import { pusherClient } from "@/lib/pusher-client";
import ConnectionStatusHandler from "@/services/pusher/connection-status-handler";
import useConnectionStatus from "@/store/connection-status-store";
import { RoomContent } from "@/types/room";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useRef } from "react";

function GlobalPusherProvider() {
  const { data: session, update } = useSession();
  const { setStatus: updateConnectionStatus } = useConnectionStatus();
  const queryClient = useQueryClient();
  const isMountedRef = useRef(true);
  const channelRef = useRef<ReturnType<typeof pusherClient.subscribe> | null>(
    null,
  );

  const conHandler = useMemo(
    () =>
      new ConnectionStatusHandler(
        isMountedRef,
        updateConnectionStatus,
        getHomePusherConnectionState,
        showErrorConnectionMessage,
      ),
    [update],
  );

  // Handle Pusher connection state changes to ensure reconnection
  useEffect(() => {
    isMountedRef.current = true;
    pusherClient.connection.bind("connected", conHandler.handleConnected);
    pusherClient.connection.bind("disconnected", conHandler.handleDisconnected);
    pusherClient.connection.bind("connecting", conHandler.handleConnecting);
    pusherClient.connection.bind("state_change", conHandler.handleStateChange);

    return () => {
      isMountedRef.current = false;
      pusherClient.connection.unbind("connected", conHandler.handleConnected);
      pusherClient.connection.unbind(
        "disconnected",
        conHandler.handleDisconnected,
      );
      pusherClient.connection.unbind("connecting", conHandler.handleConnecting);
      pusherClient.connection.unbind(
        "state_change",
        conHandler.handleStateChange,
      );
    };
  }, [
    conHandler.handleConnected,
    conHandler.handleDisconnected,
    conHandler.handleConnecting,
    conHandler.handleStateChange,
  ]);

  useEffect(() => {
    if (!session?.user.id) return;

    const channelName = `user-${session.user.id}`;

    // Unsubscribe from previous channel if it exists
    if (channelRef.current) {
      channelRef.current.unbind_all();
      pusherClient.unsubscribe(channelName);
    }

    // Subscribe to the channel
    const channel = pusherClient.subscribe(channelName);
    channelRef.current = channel;

    // Handle room updates
    channel.bind("room-updated", (data: RoomContent) => {
      queryClient.setQueriesData<RoomContent[]>(
        {
          queryKey: ["rooms", session.user.id],
          exact: false,
        },
        (oldRooms) => {
          if (!oldRooms) return oldRooms;

          const idx = oldRooms.findIndex((room) => room._id === data._id);
          if (idx === -1) return oldRooms;

          const newRooms = [...oldRooms];
          newRooms[idx] = { ...newRooms[idx], ...data };
          return newRooms;
        },
      );
    });

    // Handle status updates
    channel.bind("status-update", (status: string) => {
      console.log("User status updated:", status);
      update({ ...session, user: { ...session.user, status } });
    });

    // Ensure Pusher is connected
    if (pusherClient.connection.state !== "connected") {
      pusherClient.connection.connect();
    }

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(channelName);
      channelRef.current = null;
    };
  }, [session?.user.id, queryClient, update, session]);

  return null;
}

export default GlobalPusherProvider;
