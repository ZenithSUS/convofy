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

const schema = z.object({
  message: z.string().min(1, "Message is required."),
});

type FormData = z.infer<typeof schema>;

function RoomPage() {
  const { roomId } = useParams();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const isMountedRef = useRef(true);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

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
  const { data: room } = useGetRoomById(roomId as string);
  const { data: messages } = useGetMessagesByRoom(roomId as string);
  const { mutateAsync: sendMessage } = useSendLiveMessage();
  const { mutateAsync: typingSignal } = useCheckTyping();

  // Set up Pusher subscription
  useEffect(() => {
    isMountedRef.current = true;

    const channel = pusherClient.subscribe(`chat-${roomId}`);
    console.log("Connecting to Pusher channel:", `chat-${roomId}`);
    console.log("Pusher state:", pusherClient.connection.state);

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
      console.log("Unsubscribing from channel:", `chat-${roomId}`);
      channel.unbind_all();
      channel.unsubscribe();

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [roomId, queryClient, session?.user?.id]);

  const roomData = useMemo(() => room, [room]);
  const isAllDataLoaded = useMemo(() => {
    return roomData && messages;
  }, [roomData, messages]);

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

  if (!isAllDataLoaded)
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

        {messages?.length === 0 && <p>No messages yet.</p>}
        {messages?.map((msg: Message) => {
          return (
            <div
              key={msg._id}
              className={`mb-4 w-fit rounded-md ${msg.sender._id === session?.user?.id ? "ml-auto bg-slate-200 p-2 dark:bg-slate-800" : "mr-auto bg-slate-300 p-2 dark:bg-slate-700"}`}
            >
              <strong>{msg.sender.name.split(" ")[0]}:</strong> {msg.content}
            </div>
          );
        })}

        {typingUsers.size > 0 && (
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
          className="flex gap-2 border-t p-4"
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
