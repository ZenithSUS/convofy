// React
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

// Helpers
import getPusherConnectionState from "@/helper/pusher/chat-connection-state";
import showErrorConnectionMessage from "@/helper/pusher/error";

// Services
import { ChannelEventHandler } from "@/services/pusher/channel-event-handler";
import ConnectionStatusHandler from "@/services/pusher/connection-status-handler";

// Lib
import { pusherClient } from "@/lib/pusher-client";

// Store
import useConnectionStatus from "@/store/connection-status-store";

// Types
import { MessageOutputTyping } from "@/types/message";
import { PusherChannel } from "@/types/pusher";
import { RoomContent } from "@/types/room";
import { Session } from "@/app/(views)/chat/components/chat-header";

interface useChannelProps {
  session: Session;
  roomId: string;
  room: RoomContent | undefined;
}

export const useChannel = ({ session, roomId, room }: useChannelProps) => {
  // States
  const queryClient = useQueryClient();
  const { status: connectionStatus, setStatus: setConnectionStatus } =
    useConnectionStatus();
  const [typingUsers, setTypingUsers] = useState<
    Map<string, MessageOutputTyping>
  >(new Map());

  // Refs
  const isMountedRef = useRef(true);
  const isTypingRef = useRef(false);
  const typingIndicatorRef = useRef<HTMLDivElement | null>(null);
  const channelRef = useRef<PusherChannel>(null);
  const currentRoomIdRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevConnectionStatusRef = useRef(connectionStatus);
  const isInitialMount = useRef(true);

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

  const isMember = useMemo<boolean>(
    () =>
      room?.members.some((member) => member._id === session.user.id) || false,
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
    [setConnectionStatus],
  );

  // Handle reconnection and data sync
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevConnectionStatusRef.current = connectionStatus;
      return;
    }

    const wasDisconnected = prevConnectionStatusRef.current !== "connected";
    const isNowConnected = connectionStatus === "connected";

    // If we just reconnected and user is a member of the room
    if (wasDisconnected && isNowConnected && isMember && roomId) {
      // Clear the existing messages cache to force a fresh fetch
      queryClient.removeQueries({ queryKey: ["messages", roomId] });

      queryClient.invalidateQueries({
        queryKey: ["messages", roomId],
        refetchType: "active",
      });

      queryClient.invalidateQueries({
        queryKey: ["rooms", roomId],
        refetchType: "active",
      });
    }

    // Update the ref for next comparison
    prevConnectionStatusRef.current = connectionStatus;
  }, [connectionStatus, isMember, roomId, queryClient]);

  // Handle browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log("Browser is back online");

      // Wait briefly for connection to stabilize
      if (isMember && roomId) {
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["messages", roomId] });
          queryClient.invalidateQueries({ queryKey: ["rooms", roomId] });
        }, 500);
      }
    };

    const handleOffline = () => {
      console.log("Browser went offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isMember, roomId, queryClient]);

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
    setConnectionStatus,
  ]);

  // Room channel event handlers
  useEffect(() => {
    isMountedRef.current = true;

    const cleanupChannel = () => {
      if (channelRef.current) {
        const channelName = channelRef.current.name;

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
      cleanupChannel();
      currentRoomIdRef.current = null;
      return;
    }

    if (currentRoomIdRef.current && currentRoomIdRef.current !== roomId) {
      cleanupChannel();
    }

    currentRoomIdRef.current = roomId as string;

    const channelName = `presence-chat-${roomId}`;

    if (!channelRef.current || channelRef.current.name !== channelName) {
      const existingChannel = pusherClient.channel(channelName);
      if (existingChannel) {
        existingChannel.unbind_all();
        pusherClient.unsubscribe(channelName);
      }

      const channel = pusherClient.subscribe(channelName);
      channelRef.current = channel;

      channelEventHandler.bindAllEvents(channel);
    }

    return () => {
      isMountedRef.current = false;
      queryClient.removeQueries({ queryKey: ["messages", roomId] });
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
    typingIndicatorRef,
    typingUsers,
    typingTimeoutRef,
    isMember,
    queryClient,
  };
};

export default useChannel;
