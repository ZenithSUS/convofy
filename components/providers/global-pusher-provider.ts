"use client";

import showErrorConnectionMessage from "@/helper/pusher/error";
import getHomePusherConnectionState from "@/helper/pusher/home-connection-state";
import { pusherClient } from "@/lib/pusher/pusher-client";
import ConnectionStatusHandler from "@/services/pusher/connection-status-handler";
import useConnectionStatus from "@/store/connection-status-store";
import { RoomContent, RoomRequest } from "@/types/room";
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
    [updateConnectionStatus],
  );

  // Handle Pusher connection state changes to ensure reconnection
  useEffect(() => {
    if (!session?.user.id) return;

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
    session?.user.id,
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

    // Handle room created updates
    channel.bind("room-created", (data: RoomContent) => {
      queryClient.setQueriesData<RoomContent[]>(
        {
          queryKey: ["rooms", session.user.id],
          exact: false,
        },
        (oldRooms) => {
          if (!oldRooms) return oldRooms;
          return [...oldRooms, data];
        },
      );
    });

    // Handle room deleted updates
    channel.bind("room-deleted", (roomId: string) => {
      queryClient.setQueriesData<RoomContent[]>(
        {
          queryKey: ["rooms", session.user.id],
          exact: false,
        },
        (oldRooms) => {
          if (!oldRooms) return oldRooms;
          return oldRooms.filter((room) => room._id !== roomId);
        },
      );
    });

    // Handle room invites updates
    channel.bind("room-invite-received", (data: RoomRequest) => {
      queryClient.setQueriesData<RoomRequest[]>(
        {
          queryKey: ["roomInvites", session.user.id],
        },
        (oldInvites) => {
          if (!oldInvites) return oldInvites;
          return [...oldInvites, data];
        },
      );
    });

    // Handle room last message invites updates
    channel.bind("room-invite-last-message-updated", (data: RoomRequest) => {
      queryClient.setQueriesData<RoomRequest[]>(
        {
          queryKey: ["roomInvites", session.user.id],
          exact: false,
        },
        (oldInvites) => {
          if (!oldInvites) return oldInvites;

          const idx = oldInvites.findIndex((invite) => invite._id === data._id);
          if (idx === -1) return oldInvites;

          const newInvites = [...oldInvites];
          newInvites[idx] = { ...newInvites[idx], ...data };
          return newInvites;
        },
      );
    });

    // Handle room accept updates
    channel.bind("room-accepted", (data: RoomContent) => {
      queryClient.setQueriesData<RoomContent[]>(
        {
          queryKey: ["rooms", session.user.id],
          exact: false,
        },
        (oldRooms) => {
          if (!oldRooms) return oldRooms;
          return [...oldRooms, data];
        },
      );
    });

    // Handle message seen updates
    channel.bind("message-seen", (data: { roomId: string; userId: string }) => {
      queryClient.setQueriesData<RoomContent[]>(
        {
          queryKey: ["rooms", session.user.id],
          exact: false,
        },
        (oldRooms) => {
          if (!oldRooms) return oldRooms;

          const idx = oldRooms.findIndex((room) => room._id === data.roomId);
          if (idx === -1) return oldRooms;

          const newRooms = [...oldRooms];

          if (!newRooms[idx].lastMessage) return newRooms;

          // Add the user to the seenBy array of the last message
          newRooms[idx] = {
            ...newRooms[idx],
            lastMessage: {
              ...newRooms[idx].lastMessage,
              status: {
                ...newRooms[idx].lastMessage.status,
                seenBy: [
                  ...newRooms[idx].lastMessage.status.seenBy,
                  data.userId,
                ],
              },
            },
          };
          return newRooms;
        },
      );
    });

    // Handle status updates
    channel.bind("status-update", (status: string) => {
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
