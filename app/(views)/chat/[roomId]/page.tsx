"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import RoomHeader from "../components/room-header";
import { useGetRoomById } from "@/hooks/use-rooms";
import { Room } from "@/types/room";
import { CreateMessage, Message, MessageTyping } from "@/types/message";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Loading from "@/components/ui/loading";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useCheckTyping,
  useGetMessagesByRoom,
  useSendLiveMessage,
} from "@/hooks/use-message";
import { useSession } from "next-auth/react";
import { pusherClient } from "@/lib/pusher-client";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { User } from "@/types/user";
import { toast } from "react-toastify";
import ErrorMessage from "@/components/ui/error-message";
import { AxiosError } from "axios/";
import MessageCard from "@/app/(views)/chat/components/cards/message-card";
import { Session } from "next-auth";
import EmojiSelection from "../components/emoji-selection";
import NotJoinedModal from "../components/modals/not-joined-modal";
import showErrorConnectionMessage from "@/helper/pusher-error";
import getPusherConnectionState from "@/helper/pusher-connection-state";
import { PusherConnectionStatus, PusherState } from "@/types/pusher";

const schema = z.object({
  message: z.string().min(1, "Message is required."),
});

type FormData = z.infer<typeof schema>;

function RoomPage() {
  const { roomId } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const isMountedRef = useRef(true);
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);
  const currentRoomIdRef = useRef<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      message: "",
    },
  });

  const [isSending, setIsSending] = useState<boolean>(false);
  const [typingUsers, setTypingUsers] = useState<Map<string, MessageTyping>>(
    new Map(),
  );
  const [connectionStatus, setConnectionStatus] = useState<
    PusherConnectionStatus | string
  >("connecting");

  const {
    data: room,
    isLoading: roomLoading,
    isError: roomError,
    error: roomErrorData,
  } = useGetRoomById(roomId as string);

  const {
    data: messages,
    isLoading: messagesLoading,
    isError: messagesError,
    error: messagesErrorData,
  } = useGetMessagesByRoom(roomId as string);

  const { mutateAsync: sendMessage } = useSendLiveMessage();
  const { mutateAsync: typingSignal } = useCheckTyping();

  // Memoize data
  const roomData = useMemo(() => room, [room]);
  const messagesData = useMemo(() => messages, [messages]);

  // Error handling
  const isChatError = useMemo(() => {
    return roomError || messagesError;
  }, [roomError, messagesError]);

  const chatErrorData = useMemo(() => {
    return roomErrorData || messagesErrorData;
  }, [roomErrorData, messagesErrorData]);

  // Loading states
  const isAllLoading = useMemo(() => {
    if (isChatError) return false;
    return roomLoading || messagesLoading;
  }, [roomLoading, messagesLoading, isChatError]);

  const isAllDataLoaded = useMemo(() => {
    if (isChatError) return true;
    return roomData && messagesData && session;
  }, [roomData, messagesData, session, isChatError]);

  // Handle connection events (independent of room)
  useEffect(() => {
    if (!session) return;

    const handleStateChange = (states: PusherState) => {
      console.log("Pusher state changed:", states);
      if (isMountedRef.current) {
        const currentState = states.current as PusherConnectionStatus;
        setConnectionStatus(currentState);
        getPusherConnectionState(currentState);
      }
    };

    const handleConnected = () => {
      if (isMountedRef.current) {
        toast.success("Connected to Room");
        setConnectionStatus("connected");
      }
    };

    const handleDisconnected = () => {
      if (isMountedRef.current) {
        setConnectionStatus("disconnected");
        toast.warn("Connection lost. Reconnecting...");
      }
    };

    const handleConnecting = () => {
      if (isMountedRef.current) {
        setConnectionStatus("connecting");
      }
    };

    const handleUnavailable = () => {
      if (isMountedRef.current) {
        setConnectionStatus("unavailable");
        toast.error("Connection unavailable. Check your network.");
      }
    };

    const handleFailed = () => {
      if (isMountedRef.current) {
        setConnectionStatus("failed");
        toast.error("Failed to connect. Please refresh the page.");
      }
    };

    const handleError = (err: any) => {
      console.error("Pusher connection error:", err);
      if (isMountedRef.current) {
        setConnectionStatus("error");
        showErrorConnectionMessage(err);
      }
    };

    // Bind connection events
    pusherClient.connection.bind("state_change", handleStateChange);
    pusherClient.connection.bind("connected", handleConnected);
    pusherClient.connection.bind("disconnected", handleDisconnected);
    pusherClient.connection.bind("connecting", handleConnecting);
    pusherClient.connection.bind("unavailable", handleUnavailable);
    pusherClient.connection.bind("failed", handleFailed);
    pusherClient.connection.bind("error", handleError);

    // Get initial connection state
    const initialState = pusherClient.connection.state;
    setConnectionStatus(initialState);

    // Cleanup connection events
    return () => {
      pusherClient.connection.unbind("state_change", handleStateChange);
      pusherClient.connection.unbind("connected", handleConnected);
      pusherClient.connection.unbind("disconnected", handleDisconnected);
      pusherClient.connection.unbind("connecting", handleConnecting);
      pusherClient.connection.unbind("unavailable", handleUnavailable);
      pusherClient.connection.unbind("failed", handleFailed);
      pusherClient.connection.unbind("error", handleError);
    };
  }, [session]);

  // Handle channel subscription
  useEffect(() => {
    isMountedRef.current = true;

    // Helper function to cleanup existing channel
    const cleanupChannel = () => {
      if (channelRef.current) {
        const channelName = channelRef.current.name;
        console.log(`Cleaning up channel: ${channelName}`);

        // Unbind all events first
        channelRef.current.unbind_all();

        // Unsubscribe from the channel
        try {
          pusherClient.unsubscribe(channelName);
        } catch (error) {
          console.error("Error unsubscribing from channel:", error);
        }

        // Clear reference
        channelRef.current = null;
      }

      // Clear typing users
      setTypingUsers(new Map());

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      // Reset typing state
      isTypingRef.current = false;
    };

    // Early returns with proper cleanup
    if (!roomId || !session?.user?.id) {
      cleanupChannel();
      currentRoomIdRef.current = null;
      return;
    }

    if (!room?.members?.includes(session.user.id)) {
      console.log(`User ${session.user.id} is not a member of room ${roomId}`);
      cleanupChannel();
      currentRoomIdRef.current = null;
      return;
    }

    // Check if we're changing rooms
    if (currentRoomIdRef.current && currentRoomIdRef.current !== roomId) {
      console.log(
        `Changing from room ${currentRoomIdRef.current} to ${roomId}`,
      );
      cleanupChannel();
    }

    // Update current room reference
    currentRoomIdRef.current = roomId as string;

    // Create channel name
    const channelName = `chat-${roomId}`;

    // Only subscribe if we don't already have this channel
    if (!channelRef.current || channelRef.current.name !== channelName) {
      console.log(`Subscribing to channel: ${channelName}`);

      // Make sure to unsubscribe any existing subscription first
      const existingChannel = pusherClient.channel(channelName);
      if (existingChannel) {
        console.log(`Found existing channel ${channelName}, cleaning up...`);
        existingChannel.unbind_all();
        pusherClient.unsubscribe(channelName);
      }

      const channel = pusherClient.subscribe(channelName);
      channelRef.current = channel;

      // Handle subscription errors
      channel.bind("pusher:subscription_error", (status: PusherState) => {
        console.error("Subscription error:", status);
        if (isMountedRef.current) {
          toast.error("Failed to subscribe to room. Please refresh.");
        }
      });

      // Handle successful subscription
      channel.bind("pusher:subscription_succeeded", () => {
        console.log(`✅ Successfully subscribed to channel: ${channelName}`);
      });

      // Get Subscription Count
      channel.bind("pusher:subscription_count", (data: any) => {
        console.log(
          `Subscription count for ${channelName}:`,
          data.subscription_count,
        );
      });

      // Handle new messages
      channel.bind("new-message", (data: Message) => {
        // console.log("Received new message:", data);
        if (isMountedRef.current && currentRoomIdRef.current === roomId) {
          queryClient.setQueryData(
            ["messages", roomId],
            (old: Message[] | undefined) => {
              if (!old) return [data];

              // Prevent duplicate messages
              const messageExists = old.some((msg) => msg._id === data._id);
              if (messageExists) return old;

              return [...old, data];
            },
          );

          queryClient.invalidateQueries({ queryKey: ["rooms"] });
        }
      });

      // Handle deleted messages
      channel.bind("delete-message", (data: Message) => {
        // console.log("Delete message event:", data);
        if (isMountedRef.current && currentRoomIdRef.current === roomId) {
          queryClient.setQueryData(
            ["messages", roomId],
            (old: Message[] | undefined) => {
              if (!old) return [];
              return old.filter((msg) => msg._id !== data._id);
            },
          );

          queryClient.invalidateQueries({ queryKey: ["rooms"] });
        }
      });

      // Handle typing
      const handleTyping = (data: MessageTyping) => {
        if (
          isMountedRef.current &&
          currentRoomIdRef.current === roomId &&
          data.user.id !== session.user.id
        ) {
          setTypingUsers((prev) => new Map(prev).set(data.user.id, data));
        }
      };

      // Handle stop typing
      const handleStop = (data: MessageTyping) => {
        if (isMountedRef.current && currentRoomIdRef.current === roomId) {
          setTypingUsers((prev) => {
            const newMap = new Map(prev);
            newMap.delete(data.user.id);
            return newMap;
          });
        }
      };

      // Bind typing events
      channel.bind("typing-start", handleTyping);
      channel.bind("typing-end", handleStop);
    }

    // Cleanup function
    return () => {
      console.log(`Unmounting room ${roomId}, cleaning up...`);
      isMountedRef.current = false;
      cleanupChannel();
      currentRoomIdRef.current = null;
    };
  }, [roomId, session?.user?.id, room?.members, queryClient]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.refetchQueries({ queryKey: ["rooms"] }),
      queryClient.refetchQueries({ queryKey: ["messages", roomId] }),
    ]);
  }, [queryClient, roomId]);

  const handleEmojiAppend = (emoji: string) => {
    form.setValue("message", form.getValues("message") + emoji);
  };

  const handleSendMessage = async (data: FormData) => {
    if (data.message.trim() === "") return;

    const messageData: CreateMessage = {
      sender: session?.user?.id!,
      room: roomId as string,
      content: data.message,
      type: "text",
    };

    const messageContent = data.message;
    form.reset();

    if (isTypingRef.current) {
      await handleStopTypingUser();
    }

    try {
      setIsSending(true);
      await sendMessage(messageData);
    } catch (error) {
      console.error("Failed to send message:", error);

      if (isMountedRef.current) {
        form.setValue("message", messageContent);
      }

      toast.error("Failed to send message.");
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  const handleTypingUser = async () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      try {
        await typingSignal({
          roomId: roomId as string,
          user: session?.user! as Omit<User, "_id"> & { id: string },
          isTyping: true,
        });
      } catch (error) {
        console.error("Failed to send typing signal:", error);
      }
    }

    typingTimeoutRef.current = setTimeout(() => {
      handleStopTypingUser();
    }, 3000);
  };

  const handleStopTypingUser = async () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (isTypingRef.current) {
      isTypingRef.current = false;
      try {
        await typingSignal({
          roomId: roomId as string,
          user: session?.user! as Omit<User, "_id"> & { id: string },
          isTyping: false,
        });
      } catch (error) {
        console.error("Failed to send stop typing signal:", error);
      }
    }
  };

  if (!isAllDataLoaded || isAllLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <RoomHeader room={roomData as Room} />
      {connectionStatus !== "connected" && (
        <div
          className={`border-l-4 p-4 ${
            connectionStatus === "failed"
              ? "border-red-500 bg-red-100 text-red-700"
              : "border-yellow-500 bg-yellow-100 text-yellow-700"
          }`}
        >
          <p className="font-bold">Connection Issue</p>
          <p>
            {connectionStatus === "connecting" && "Connecting..."}
            {connectionStatus === "disconnected" &&
              "Disconnected. Reconnecting..."}
            {connectionStatus === "unavailable" &&
              "Network unavailable. Check your connection."}
            {connectionStatus === "failed" &&
              "Connection failed. Please refresh."}
            {connectionStatus === "error" && "Connection error. Retrying..."}
          </p>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4">
        {messagesData?.length === 0 ? (
          <p className="text-center font-semibold">No messages yet.</p>
        ) : isChatError ? (
          <ErrorMessage
            error={chatErrorData as AxiosError}
            onClick={handleRefresh}
          />
        ) : (
          messages?.map((msg: Message) => (
            <MessageCard
              key={msg._id}
              message={msg}
              session={session as Session}
            />
          ))
        )}

        {!isChatError && typingUsers.size > 0 && (
          <div className="mt-2 text-sm text-gray-500 italic">
            {Array.from(typingUsers.values())
              .map((typing) => typing.user.name)
              .join(", ")}{" "}
            {typingUsers.size > 1 ? "are" : "is"} typing...
          </div>
        )}
      </div>

      {room?.members.includes(session?.user?.id as string) ? (
        <Form {...form}>
          <form
            className="relative flex gap-2 border-t p-4"
            onSubmit={form.handleSubmit(handleSendMessage)}
          >
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem className="flex-1 items-center">
                  <FormLabel className="sr-only">Message</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={
                        isSending ? "Sending..." : "Type a message..."
                      }
                      className="mr-2"
                      disabled={isSending}
                      onChange={(e) => {
                        field.onChange(e);
                        if (e.target.value.length > 0) {
                          handleTypingUser();
                        } else {
                          handleStopTypingUser();
                        }
                      }}
                      onBlur={() => handleStopTypingUser()}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <EmojiSelection onEmojiAppend={handleEmojiAppend} />
            <Button
              type="submit"
              className="disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSending}
            >
              Send {isSending && <Loader2 className="animate-spin" />}
            </Button>
          </form>
        </Form>
      ) : (
        <NotJoinedModal
          roomId={roomId as string}
          userId={session?.user?.id as string}
        />
      )}
    </div>
  );
}

export default RoomPage;
