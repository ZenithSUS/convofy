"use client";

import { useEffect, useMemo, useTransition, useRef, useState } from "react";
import { useParams } from "next/navigation";
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
import MessageCard from "../components/message-card";
import { Session } from "next-auth";
import EmojiSelection from "../components/emoji-selection";

const schema = z.object({
  message: z.string().min(1, "Message is required."),
});

type FormData = z.infer<typeof schema>;

function RoomPage() {
  const { roomId } = useParams();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const isMountedRef = useRef(true);
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      message: "",
    },
  });

  const [isSending, _] = useTransition();
  const [typingUsers, setTypingUsers] = useState<Map<string, MessageTyping>>(
    new Map(),
  );
  const {
    data: room,
    isLoading: roomLoading,
    isError: roomError,
    error: roomErrorData,
    refetch: refetchRoom,
  } = useGetRoomById(roomId as string);
  const {
    data: messages,
    isLoading: messagesLoading,
    isError: messagesError,
    error: messagesErrorData,
    refetch: refetchMessages,
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
  }, [roomLoading, messagesLoading]);

  const isAllDataLoaded = useMemo(() => {
    if (isChatError) return true;

    return roomData && messagesData;
  }, [roomData, messages]);

  // Set up Pusher subscription
  useEffect(() => {
    isMountedRef.current = true;

    const channel = pusherClient.subscribe(`chat-${roomId}`);

    // Handle new messages
    channel.bind("new-message", (data: Message) => {
      // Only update if component is still mounted
      if (isMountedRef.current) {
        // Update react-query cache with the new message
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

        // Update rooms list to show latest message
        queryClient.invalidateQueries({ queryKey: ["rooms"] });
      }
    });

    // Handle deleted messages
    channel.bind("delete-message", (data: Message) => {
      // Only update if component is still mounted
      if (isMountedRef.current) {
        // Update react-query cache with the new message
        queryClient.setQueryData(
          ["messages", roomId],
          (old: Message[] | undefined) => {
            if (!old) return [data];

            // If exists filter out
            const messageExists = old.some((msg) => msg._id === data._id);
            if (messageExists)
              return [...old.filter((msg) => msg._id !== data._id)];

            return [...old, data];
          },
        );

        // Update rooms list to show latest message
        queryClient.invalidateQueries({ queryKey: ["rooms"] });
      }
    });

    // Handle typing
    const handleTyping = (data: MessageTyping) => {
      // Only update if component is still mounted and user is not the current user
      if (isMountedRef.current && data.user.id !== session?.user?.id) {
        setTypingUsers((prev) => new Map(prev).set(data.user.id, data));
      }
    };

    // Handle stop typing
    const handleStop = (data: MessageTyping) => {
      if (isMountedRef.current) {
        setTypingUsers((prev) => {
          const newMap = new Map(prev);
          newMap.delete(data.user.id);
          return newMap;
        });
      }
    };

    // Bind typing users
    channel.bind("typing-start", (data: MessageTyping) => handleTyping(data));
    channel.bind("typing-end", (data: MessageTyping) => handleStop(data));

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      channel.unbind_all();
      channel.unsubscribe();

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [roomId, queryClient, session?.user?.id]);

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

    // Reset form immediately for better UX
    const messageContent = data.message;
    form.reset();

    // Stop typing indicator when sending
    if (isTypingRef.current) {
      await handleStopTypingUser();
    }

    try {
      await sendMessage(messageData);
    } catch (error) {
      console.error("Failed to send message:", error);

      // Restore message on error
      if (isMountedRef.current) {
        form.setValue("message", messageContent);
      }

      toast.error("Failed to send message.");
      throw error;
    }
  };

  const handleTypingUser = async () => {
    // Start typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Only start the typing if not already typing
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

    // Add a timeout to stop typing after 3 seconds
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

  if (!isAllDataLoaded || isAllLoading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loading />
      </div>
    );

  return (
    <div className="flex h-screen flex-col">
      <RoomHeader room={roomData as Room} />
      <div className="flex-1 overflow-y-auto p-4">
        {/* Room Header */}

        {messagesData?.length === 0 ? (
          <p className="text-center font-semibold">No messages yet.</p>
        ) : isChatError ? (
          <ErrorMessage
            error={chatErrorData as AxiosError}
            onClick={refetchMessages}
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
                    placeholder="Type a message..."
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
    </div>
  );
}

export default RoomPage;
