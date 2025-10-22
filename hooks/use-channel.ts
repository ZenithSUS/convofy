// React
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

// Next
import { Session } from "next-auth";

// Helpers
import getPusherConnectionState from "@/helper/pusher-connection-state";
import showErrorConnectionMessage from "@/helper/pusher-error";

// Services
import { ChannelEventHandler } from "@/services/pusher/channel-event-handler";
import ConnectionStatusHandler from "@/services/pusher/connection-status-handler";

// Lib
import { pusherClient } from "@/lib/pusher-client";

// Types
import { MessageTyping } from "@/types/message";
import { PusherChannel, PusherConnectionStatus } from "@/types/pusher";
import { RoomContent } from "@/types/room";

export interface useChannelProps {
  session: Session;
  roomId: string;
  room: RoomContent | undefined;
}

export const useChannel = ({ session, roomId, room }: useChannelProps) => {
  // States
  const queryClient = useQueryClient();
  const [connectionStatus, setConnectionStatus] = useState<
    PusherConnectionStatus | string
  >("connecting");
  const [typingUsers, setTypingUsers] = useState<Map<string, MessageTyping>>(
    new Map(),
  );

  // Refs
  const isMountedRef = useRef(true);
  const isTypingRef = useRef(false);
  const channelRef = useRef<PusherChannel>(null);
  const currentRoomIdRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memos
  const channelEventHandler = useMemo(
    () =>
      new ChannelEventHandler(
        queryClient,
        roomId as string,
        session?.user?.id as string,
        isMountedRef,
        currentRoomIdRef,
        setTypingUsers,
      ),
    [queryClient, roomId, session?.user?.id],
  );

  const isMember = useMemo(
    () => room?.members.some((member) => member._id === session.user.id),
    [room, session],
  );

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

  // Channel event handlers
  useEffect(() => {
    if (!session) return;

    pusherClient.connection.bind("state_change", conHandler.handleStateChange);
    pusherClient.connection.bind("connected", conHandler.handleConnected);
    pusherClient.connection.bind("disconnected", conHandler.handleDisconnected);
    pusherClient.connection.bind("connecting", conHandler.handleConnecting);
    pusherClient.connection.bind("unavailable", conHandler.handleUnavailable);
    pusherClient.connection.bind("failed", conHandler.handleFailed);
    pusherClient.connection.bind("error", conHandler.handleError);

    const initialState = pusherClient.connection.state;
    setConnectionStatus(initialState);

    return () => {
      pusherClient.connection.unbind(
        "state_change",
        conHandler.handleStateChange,
      );
      pusherClient.connection.unbind("connected", conHandler.handleConnected);
      pusherClient.connection.unbind(
        "disconnected",
        conHandler.handleDisconnected,
      );
      pusherClient.connection.unbind("connecting", conHandler.handleConnecting);
      pusherClient.connection.unbind(
        "unavailable",
        conHandler.handleUnavailable,
      );
      pusherClient.connection.unbind("failed", conHandler.handleFailed);
      pusherClient.connection.unbind("error", conHandler.handleError);
    };
  }, [
    session,
    conHandler.handleStateChange,
    conHandler.handleConnected,
    conHandler.handleDisconnected,
    conHandler.handleConnecting,
    conHandler.handleUnavailable,
    conHandler.handleFailed,
    conHandler.handleError,
  ]);

  // Room channel event handlers
  useEffect(() => {
    isMountedRef.current = true;

    const cleanupChannel = () => {
      if (channelRef.current) {
        const channelName = channelRef.current.name;
        console.log(`Cleaning up channel: ${channelName}`);

        channelRef.current.unbind_all();

        try {
          pusherClient.unsubscribe(channelName);
        } catch (error) {
          console.error("Error unsubscribing from channel:", error);
        }

        channelRef.current = null;
      }

      setTypingUsers(new Map());

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      isTypingRef.current = false;
    };

    if (!roomId || !session?.user?.id) {
      cleanupChannel();
      currentRoomIdRef.current = null;
      return;
    }

    if (!isMember) {
      console.log(`User ${session.user.id} is not a member of room ${roomId}`);
      cleanupChannel();
      currentRoomIdRef.current = null;
      return;
    }

    if (currentRoomIdRef.current && currentRoomIdRef.current !== roomId) {
      console.log(
        `Changing from room ${currentRoomIdRef.current} to ${roomId}`,
      );
      cleanupChannel();
    }

    currentRoomIdRef.current = roomId as string;

    const channelName = `chat-${roomId}`;

    if (!channelRef.current || channelRef.current.name !== channelName) {
      console.log(`Subscribing to channel: ${channelName}`);

      const existingChannel = pusherClient.channel(channelName);
      if (existingChannel) {
        console.log(`Found existing channel ${channelName}, cleaning up...`);
        existingChannel.unbind_all();
        pusherClient.unsubscribe(channelName);
      }

      const channel = pusherClient.subscribe(channelName);
      channelRef.current = channel;

      channelEventHandler.bindAllEvents(channel);
    }

    return () => {
      console.log(`Unmounting room ${roomId}, cleaning up...`);
      isMountedRef.current = false;
      cleanupChannel();
      currentRoomIdRef.current = null;
    };
  }, [
    roomId,
    session?.user?.id,
    room?.members,
    queryClient,
    isMember,
    channelEventHandler,
  ]);

  return {
    isMountedRef,
    connectionStatus,
    isTypingRef,
    typingUsers,
    typingTimeoutRef,
    isMember,
    queryClient,
  };
};
