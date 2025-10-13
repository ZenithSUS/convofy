"use client";

import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams } from "next/navigation";
import RoomHeader from "../components/room-header";
import { useGetRoomById } from "@/hooks/use-rooms";
import { Room } from "@/types/room";
import { CreateMessage, Message, MessageTyping } from "@/types/message";
import { Textarea } from "@/components/ui/textarea";
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
import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import { FileIcon, Loader2 } from "lucide-react";
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
import {
  PusherChannel,
  PusherConnectionStatus,
  PusherState,
  PusherSubsciption,
} from "@/types/pusher";
import MediaUpload from "../components/media-upload";
import { useUploadImage } from "@/hooks/use-upload";
import Image from "next/image";
import { FileInfo } from "@/types/file";
// import { useInView } from "react-intersection-observer";

const schemaMessage = z.object({
  message: z.string(),
});

type FormData = z.infer<typeof schemaMessage>;

function RoomPage() {
  const { roomId } = useParams();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const isMountedRef = useRef(true);
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<PusherChannel>(null);
  const currentRoomIdRef = useRef<string | null>(null);
  // const { ref, inView } = useInView();

  const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);

  const messageForm = useForm<FormData>({
    resolver: zodResolver(schemaMessage),
    defaultValues: {
      message: "",
    },
  });

  const [currentEditId, setCurrentEditId] = useState<string | null>(null);
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
    isFetching: isFetchingRoom,
    isError: roomError,
    error: roomErrorData,
    refetch: refetchRoom,
  } = useGetRoomById(roomId as string);

  const {
    data: messages,
    isLoading: messagesLoading,
    isFetching: isFetchingMessages,
    isError: messagesError,
    error: messagesErrorData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchMessages,
  } = useGetMessagesByRoom(roomId as string);

  const { mutateAsync: sendMessage } = useSendLiveMessage();
  const { mutateAsync: typingSignal } = useCheckTyping();
  const { uploadImage, isUploading } = useUploadImage();

  // Memoize data
  const roomData = useMemo(() => room, [room]);

  // Flatten pages but keep stable order and remove duplicates (preserve first occurrence)
  const messagesData = useMemo(() => {
    const flat = (messages?.pages ?? []).flat() as Message[];
    const seen = new Set<string>();
    const unique: Message[] = [];
    for (const msg of flat) {
      if (!msg || !msg._id) continue;
      if (!seen.has(msg._id)) {
        seen.add(msg._id);
        unique.push(msg);
      }
    }
    return unique.reverse();
  }, [messages]);

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

  const isAllFetching = useMemo(() => {
    if (isChatError) return false;
    return isFetchingRoom || isFetchingMessages;
  }, [isFetchingRoom, isFetchingMessages, isChatError]);

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
        // toast.success("Connected to Room");
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

    const handleError = (error: unknown) => {
      const err = error as Error;
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
      channel.bind("pusher:subscription_count", (data: PusherSubsciption) => {
        console.log(
          `Subscription count for ${channelName}:`,
          data.subscription_count,
        );
      });

      // Handle new messages
      channel.bind("new-message", (data: Message) => {
        if (isMountedRef.current && currentRoomIdRef.current === roomId) {
          queryClient.setQueryData(
            ["messages", roomId],
            (old: InfiniteData<Message[]> | undefined) => {
              if (!old) {
                return {
                  pages: [[data]],
                  pageParams: [],
                };
              }

              const allMessages = old.pages.flat();
              const messageExists = allMessages.some(
                (msg) => msg._id === data._id,
              );
              if (messageExists) return old;

              // Add the new message to the FIRST page of the cache
              const newPages = [...old.pages];
              newPages[0] = [data, ...newPages[0]]; // prepend to page 0

              return { ...old, pages: newPages };
            },
          );

          queryClient.invalidateQueries({ queryKey: ["rooms"] });
        }
      });

      // Handle deleted messages
      channel.bind("delete-message", (data: Message) => {
        if (isMountedRef.current && currentRoomIdRef.current === roomId) {
          // Update messages cache by removing the deleted message
          queryClient.setQueryData(
            ["messages", roomId],
            (old: InfiniteData<Message[]> | undefined) => {
              if (!old) return old;

              // Filter out the deleted message from all pages
              const newPages = old.pages.map((page) =>
                page.filter((msg) => msg._id !== data._id),
              );

              return {
                ...old,
                pages: newPages,
              };
            },
          );

          // Still invalidate rooms to update last message preview
          queryClient.invalidateQueries({ queryKey: ["rooms"] });
        }
      });

      // Handle edit messages
      channel.bind("edit-message", (data: Message) => {
        if (isMountedRef.current && currentRoomIdRef.current === roomId) {
          // Update messages cache by replacing the edited message
          queryClient.setQueryData(
            ["messages", roomId],
            (old: InfiniteData<Message[]> | undefined) => {
              if (!old) return old;

              // Replace the edited message in all pages
              const newPages = old.pages.map((page) => {
                // If the message doesn't exist in this page, return the page
                if (!page.some((msg) => msg._id === data._id)) {
                  return page;
                }

                // If the previous messages matches then update it
                return page.map((msg) => {
                  if (msg._id === data._id) {
                    return data;
                  }
                  return msg;
                });
              });

              return {
                ...old,
                pages: newPages,
              };
            },
          );
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

  // Check if the chat is in view
  // useEffect(() => {
  //   if (inView && hasNextPage && !isFetchingNextPage) {
  //     fetchNextPage();
  //   }
  // }, [fetchNextPage, inView, hasNextPage, isFetchingNextPage]);

  const handleRefresh = useCallback(async () => {
    queryClient.removeQueries({ queryKey: ["messages", roomId] });
    queryClient.removeQueries({ queryKey: ["rooms"] });

    await Promise.all([refetchMessages(), refetchRoom()]);
  }, [queryClient, roomId, refetchMessages, refetchRoom]);

  const handleAppendFile = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      for (let i = 0; i < e.target.files.length; i++) {
        const reader = new FileReader();
        const file = e.target.files[i];

        reader.onloadend = () => {
          if (reader.result) {
            setSelectedFiles((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                name: file.name,
                type: file.type,
                image: reader.result as string,
                date: new Date(file.lastModified),
                size: file.size,
                file: file,
              },
            ]);
          }
        };

        reader.readAsDataURL(file);
      }
    }
  };

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleEmojiAppend = (emoji: string) => {
    messageForm.setValue("message", messageForm.getValues("message") + emoji);
  };

  const handleSendMessage = async (data: FormData) => {
    if (isSending) return;

    if (!session) return;

    if (data.message.trim() === "" && selectedFiles.length === 0) {
      toast.error("At least one input is required: message or media.");
      return;
    }

    const messageContent = data.message;
    messageForm.reset();

    if (isTypingRef.current) {
      await handleStopTypingUser();
    }

    try {
      setIsSending(true);

      // Send text message if present
      if (data.message.trim() !== "") {
        const messageData: CreateMessage = {
          sender: session.user.id as string,
          room: roomId as string,
          isEdited: false,
          content: data.message,
          type: "text",
        };
        await sendMessage(messageData);
      }

      // Send media messages
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map(async (fileInfo) => {
          const url = await uploadImage(fileInfo.file);
          if (!url) {
            throw new Error(`Failed to upload ${fileInfo.name}`);
          }
          const type = fileInfo.type.startsWith("image/") ? "image" : "file";

          const messageData: CreateMessage = {
            sender: session.user.id as string,
            room: roomId as string,
            content: url,
            type,
          };
          return sendMessage(messageData);
        });

        // Upload all selected files at once
        await Promise.all(uploadPromises);
      }

      // Clear selected files after successful send
      setSelectedFiles([]);
    } catch (error) {
      console.error("Failed to send message:", error);

      if (isMountedRef.current) {
        messageForm.setValue("message", messageContent);
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
        if (!session) throw Error("Session is required");

        await typingSignal({
          roomId: roomId as string,
          user: session.user! as Omit<User, "_id"> & { id: string },
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
        if (!session) throw Error("Session is required");

        await typingSignal({
          roomId: roomId as string,
          user: session.user! as Omit<User, "_id"> & { id: string },
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
      <div className="flex-1 flex-col-reverse overflow-y-auto p-4">
        {hasNextPage && (
          <div className="mb-4 flex items-center justify-center">
            {!isFetchingNextPage && !isChatError && (
              <Button
                onClick={() => fetchNextPage()}
                className="cursor-pointer text-sm"
              >
                Load More
              </Button>
            )}
          </div>
        )}

        {isChatError && (
          <ErrorMessage
            error={chatErrorData as AxiosError}
            onClick={handleRefresh}
          />
        )}

        {isAllFetching && (
          <div className="mb-4 flex items-center justify-center gap-2">
            <Loader2 className="text-primary animate-spin" size={30} />
            <h1 className="text-xl">Loading messages…</h1>
          </div>
        )}

        {!isChatError && !isAllFetching && messagesData.length === 0 ? (
          <p className="text-center font-semibold">No messages yet.</p>
        ) : (
          messagesData.map((msg: Message) => (
            <MessageCard
              key={msg._id}
              message={msg}
              session={session as Session}
              isThisEditing={currentEditId === msg._id}
              isAnyEditing={!!currentEditId}
              onEditComplete={() => setCurrentEditId(null)}
              onCancelEdit={() => setCurrentEditId(null)}
              setCurrentEditId={setCurrentEditId}
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
        <Form {...messageForm}>
          <form
            className="relative flex gap-2 border-t p-4"
            onSubmit={messageForm.handleSubmit(handleSendMessage)}
          >
            <FormField
              control={messageForm.control}
              name="message"
              render={({ field }) => (
                <FormItem className="flex-1 items-center">
                  <FormLabel className="sr-only">Message</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={
                        isSending ? "Sending..." : "Type a message..."
                      }
                      className="mr-2 h-15 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-base"
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

            <MediaUpload
              onChange={handleAppendFile}
              isUploading={isUploading}
            />
            <EmojiSelection onEmojiAppend={handleEmojiAppend} />
            <Button
              type="submit"
              className="disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSending || isUploading}
            >
              Send{" "}
              {isSending ||
                (isUploading && <Loader2 className="animate-spin" />)}
            </Button>
          </form>

          {selectedFiles.length > 0 && (
            <div className="grid h-30 w-full grid-cols-2 gap-2 overflow-y-auto p-4 md:grid-cols-4">
              {selectedFiles.map((file, index) => {
                /* If the file type is an image */
                if (file.type.startsWith("image")) {
                  return (
                    <div key={file.id} className="relative w-fit">
                      <Image
                        src={file.image}
                        alt={file.name}
                        width={0}
                        height={0}
                        className="h-25 w-50 object-cover"
                        unoptimized={file.image.startsWith("data:image")}
                        priority
                      />
                      <button
                        className="absolute top-0 right-0 bg-red-500 p-2 text-white"
                        onClick={() => handleRemoveFile(index)}
                      >
                        X
                      </button>
                    </div>
                  );

                  /* If the file type is an application */
                } else if (file.type.startsWith("application")) {
                  return (
                    <div
                      key={file.id}
                      className="relative border-2 border-dashed"
                    >
                      <div className="flex h-20 max-w-xs items-center gap-2 p-2">
                        <FileIcon className="mr-2 h-4 w-4" />
                        <span className="truncate">{file.name}</span>
                      </div>
                      <button
                        className="absolute top-0 right-0 cursor-pointer bg-red-500 px-2 text-white"
                        onClick={() => handleRemoveFile(index)}
                      >
                        X
                      </button>
                    </div>
                  );
                } else {
                  return null;
                }
              })}
            </div>
          )}
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
