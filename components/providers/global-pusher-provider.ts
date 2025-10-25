"use client";

import { pusherClient } from "@/lib/pusher-client";
import { RoomContent } from "@/types/room";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

function GlobalPusherProvider() {
  const { data: session, update } = useSession();
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof pusherClient.subscribe> | null>(
    null,
  );

  // Handle Pusher connection state changes to ensure reconnection
  useEffect(() => {
    const handleDisconnected = () => {
      pusherClient.connection.connect();
    };

    pusherClient.connection.bind("disconnected", handleDisconnected);

    return () => {
      pusherClient.connection.unbind("disconnected", handleDisconnected);
    };
  }, []);

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
