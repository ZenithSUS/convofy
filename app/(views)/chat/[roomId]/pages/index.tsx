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
import RoomHeader from "@/app/(views)/chat/components/room-header";
import { useGetRoomById } from "@/hooks/use-rooms";
import { RoomContent } from "@/types/room";
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
import { pusherClient } from "@/lib/pusher-client";
import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import {
  FileIcon,
  Loader2,
  Send,
  AlertCircle,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import { User } from "@/types/user";
import { toast } from "react-toastify";
import ErrorMessage from "@/components/ui/error-message";
import { AxiosError } from "axios/";
import MessageCard from "@/app/(views)/chat/components/cards/message-card";
import { Session } from "next-auth";
import EmojiSelection from "@/app/(views)/chat/components/emoji-selection";
import NotJoinedModal from "@/app/(views)/chat/components/modals/not-joined-modal";
import showErrorConnectionMessage from "@/helper/pusher-error";
import getPusherConnectionState from "@/helper/pusher-connection-state";
import {
  PusherChannel,
  PusherConnectionStatus,
  PusherState,
  PusherSubsciption,
} from "@/types/pusher";
import MediaUpload from "@/app/(views)/chat/components/media-upload";
import { useUploadImage } from "@/hooks/use-upload";
import Image from "next/image";
import { FileInfo } from "@/types/file";

const schemaMessage = z.object({
  message: z.string(),
});

type FormData = z.infer<typeof schemaMessage>;

function RoomPageClient({ session }: { session: Session }) {
  const { roomId } = useParams();
  const queryClient = useQueryClient();
  const isMountedRef = useRef(true);
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<PusherChannel>(null);
  const currentRoomIdRef = useRef<string | null>(null);

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

  const roomData = useMemo(() => room, [room]);

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

  const isChatError = useMemo(() => {
    return roomError || messagesError;
  }, [roomError, messagesError]);

  const chatErrorData = useMemo(() => {
    return roomErrorData || messagesErrorData;
  }, [roomErrorData, messagesErrorData]);

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

  const isMember = useMemo(
    () => roomData?.members.some((member) => member._id === session?.user?.id),
    [roomData, session],
  );

  useEffect(() => {
    if (!session) return;

    const handleStateChange = (states: PusherState) => {
      if (isMountedRef.current) {
        const currentState = states.current as PusherConnectionStatus;
        setConnectionStatus(currentState);
        getPusherConnectionState(currentState);
      }
    };

    const handleConnected = () => {
      if (isMountedRef.current) {
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

    pusherClient.connection.bind("state_change", handleStateChange);
    pusherClient.connection.bind("connected", handleConnected);
    pusherClient.connection.bind("disconnected", handleDisconnected);
    pusherClient.connection.bind("connecting", handleConnecting);
    pusherClient.connection.bind("unavailable", handleUnavailable);
    pusherClient.connection.bind("failed", handleFailed);
    pusherClient.connection.bind("error", handleError);

    const initialState = pusherClient.connection.state;
    setConnectionStatus(initialState);

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

      channel.bind("pusher:subscription_error", (status: PusherState) => {
        console.error("Subscription error:", status);
        if (isMountedRef.current) {
          toast.error("Failed to subscribe to room. Please refresh.");
        }
      });

      channel.bind("pusher:subscription_succeeded", () => {
        console.log(`Successfully subscribed to channel: ${channelName}`);
      });

      channel.bind("pusher:subscription_count", (data: PusherSubsciption) => {
        console.log(
          `Subscription count for ${channelName}:`,
          data.subscription_count,
        );
      });

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

              const newPages = [...old.pages];
              newPages[0] = [data, ...newPages[0]];

              return { ...old, pages: newPages };
            },
          );

          queryClient.invalidateQueries({ queryKey: ["rooms"] });
        }
      });

      channel.bind("delete-message", (data: Message) => {
        if (isMountedRef.current && currentRoomIdRef.current === roomId) {
          queryClient.setQueryData(
            ["messages", roomId],
            (old: InfiniteData<Message[]> | undefined) => {
              if (!old) return old;

              const newPages = old.pages.map((page) =>
                page.filter((msg) => msg._id !== data._id),
              );

              return {
                ...old,
                pages: newPages,
              };
            },
          );

          queryClient.invalidateQueries({ queryKey: ["rooms"] });
        }
      });

      channel.bind("edit-message", (data: Message) => {
        if (isMountedRef.current && currentRoomIdRef.current === roomId) {
          queryClient.setQueryData(
            ["messages", roomId],
            (old: InfiniteData<Message[]> | undefined) => {
              if (!old) return old;

              const newPages = old.pages.map((page) => {
                if (!page.some((msg) => msg._id === data._id)) {
                  return page;
                }

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

      const handleTyping = (data: MessageTyping) => {
        if (
          isMountedRef.current &&
          currentRoomIdRef.current === roomId &&
          data.user.id !== session.user.id
        ) {
          setTypingUsers((prev) => new Map(prev).set(data.user.id, data));
        }
      };

      const handleStop = (data: MessageTyping) => {
        if (isMountedRef.current && currentRoomIdRef.current === roomId) {
          setTypingUsers((prev) => {
            const newMap = new Map(prev);
            newMap.delete(data.user.id);
            return newMap;
          });
        }
      };

      channel.bind("typing-start", handleTyping);
      channel.bind("typing-end", handleStop);
    }

    return () => {
      console.log(`Unmounting room ${roomId}, cleaning up...`);
      isMountedRef.current = false;
      cleanupChannel();
      currentRoomIdRef.current = null;
    };
  }, [roomId, session?.user?.id, room?.members, queryClient, isMember]);

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

        await Promise.all(uploadPromises);
      }

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
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center gap-4">
          <Loading />
          <p className="text-sm text-gray-600">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <RoomHeader
        room={roomData as RoomContent}
        userId={session?.user.id as string}
      />

      {/* Enhanced Connection Status Banner */}
      {connectionStatus !== "connected" && (
        <div
          className={`flex items-center justify-between border-l-4 px-6 py-3 shadow-sm ${
            connectionStatus === "failed"
              ? "border-red-500 bg-red-50 text-red-800"
              : connectionStatus === "unavailable"
                ? "border-orange-500 bg-orange-50 text-orange-800"
                : "border-yellow-500 bg-yellow-50 text-yellow-800"
          }`}
        >
          <div className="flex items-center gap-3">
            {connectionStatus === "failed" ? (
              <WifiOff size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <div>
              <p className="text-sm font-semibold">
                {connectionStatus === "connecting" && "Connecting to chat..."}
                {connectionStatus === "disconnected" && "Connection Lost"}
                {connectionStatus === "unavailable" && "Network Unavailable"}
                {connectionStatus === "failed" && "Connection Failed"}
                {connectionStatus === "error" && "Connection Error"}
              </p>
              <p className="text-xs opacity-90">
                {connectionStatus === "connecting" && "Please wait"}
                {connectionStatus === "disconnected" &&
                  "Attempting to reconnect..."}
                {connectionStatus === "unavailable" &&
                  "Check your internet connection"}
                {connectionStatus === "failed" && "Please refresh the page"}
                {connectionStatus === "error" && "Retrying connection..."}
              </p>
            </div>
          </div>
          {connectionStatus === "failed" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.location.reload()}
              className="bg-white hover:bg-gray-50"
            >
              <RefreshCw size={16} className="mr-1" />
              Refresh
            </Button>
          )}
        </div>
      )}

      {/* Enhanced Messages Area */}
      <div className="flex-1 flex-col-reverse overflow-y-auto p-4 md:p-6">
        {hasNextPage && (
          <div className="mb-6 flex items-center justify-center">
            {!isFetchingNextPage && !isChatError && isMember && (
              <Button
                onClick={() => fetchNextPage()}
                variant="outline"
                className="border-2 border-gray-200 bg-white shadow-sm transition-all duration-300 hover:border-blue-300 hover:shadow-md"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load Previous Messages"
                )}
              </Button>
            )}
          </div>
        )}

        {isChatError && (
          <div className="my-8">
            <ErrorMessage
              error={chatErrorData as AxiosError}
              onClick={handleRefresh}
            />
          </div>
        )}

        {isAllFetching && (
          <div className="mb-6 flex items-center justify-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
            <Loader2 className="animate-spin text-blue-600" size={24} />
            <h1 className="text-base font-medium text-blue-900">
              Loading messages...
            </h1>
          </div>
        )}

        {!isChatError && !isAllFetching && messagesData.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-20">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-purple-100">
              <Send size={40} className="text-blue-500" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-700">
              No messages yet
            </h3>
            <p className="max-w-xs text-center text-sm text-gray-500">
              Start the conversation by sending the first message
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {messagesData.map((msg: Message, index: number) => (
              <div
                key={msg._id}
                style={{
                  animation: `slideUp 0.4s ease-out ${index * 0.05}s both`,
                }}
              >
                <MessageCard
                  message={msg}
                  session={session as Session}
                  isThisEditing={currentEditId === msg._id}
                  isAnyEditing={!!currentEditId}
                  onEditComplete={() => setCurrentEditId(null)}
                  onCancelEdit={() => setCurrentEditId(null)}
                  setCurrentEditId={setCurrentEditId}
                />
              </div>
            ))}
          </div>
        )}

        {/* Enhanced Typing Indicator */}
        {!isChatError && typingUsers.size > 0 && (
          <div className="mt-4 flex w-fit items-center gap-2 rounded-full bg-gray-100 px-4 py-2">
            <div className="flex gap-1">
              <span
                className="h-2 w-2 animate-bounce rounded-full bg-blue-500"
                style={{ animationDelay: "0ms" }}
              ></span>
              <span
                className="h-2 w-2 animate-bounce rounded-full bg-blue-500"
                style={{ animationDelay: "150ms" }}
              ></span>
              <span
                className="h-2 w-2 animate-bounce rounded-full bg-blue-500"
                style={{ animationDelay: "300ms" }}
              ></span>
            </div>
            <span className="text-sm text-gray-700">
              <span className="font-medium">
                {Array.from(typingUsers.values())
                  .map((typing) => typing.user.name)
                  .join(", ")}
              </span>{" "}
              {typingUsers.size > 1 ? "are" : "is"} typing...
            </span>
          </div>
        )}
      </div>

      {/* Enhanced Input Area */}
      {isMember ? (
        <div className="border-t bg-white shadow-lg">
          {/* Enhanced File Preview Section */}
          {selectedFiles.length > 0 && (
            <div className="border-b bg-gray-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">
                  Selected Files ({selectedFiles.length})
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFiles([])}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  Clear All
                </Button>
              </div>
              <div className="grid max-h-48 grid-cols-2 gap-3 overflow-y-auto md:grid-cols-4 lg:grid-cols-6">
                {selectedFiles.map((file, index) => {
                  if (file.type.startsWith("image")) {
                    return (
                      <div
                        key={file.id}
                        className="group relative overflow-hidden rounded-lg shadow-sm transition-all hover:shadow-md"
                      >
                        <Image
                          src={file.image}
                          alt={file.name}
                          width={0}
                          height={0}
                          className="h-24 w-full object-cover"
                          unoptimized={file.image.startsWith("data:image")}
                          priority
                        />
                        <button
                          className="absolute top-1 right-1 rounded-full bg-red-500 p-1.5 text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 hover:bg-red-600"
                          onClick={() => handleRemoveFile(index)}
                        >
                          <span className="text-xs font-bold">✕</span>
                        </button>
                      </div>
                    );
                  } else if (file.type.startsWith("application")) {
                    return (
                      <div
                        key={file.id}
                        className="group relative rounded-lg border-2 border-dashed border-gray-300 bg-white transition-all hover:border-blue-400"
                      >
                        <div className="flex h-24 items-center gap-2 p-3">
                          <FileIcon className="h-6 w-6 flex-shrink-0 text-gray-500" />
                          <span className="flex-1 truncate text-xs">
                            {file.name}
                          </span>
                        </div>
                        <button
                          className="absolute top-1 right-1 rounded-full bg-red-500 p-1.5 text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 hover:bg-red-600"
                          onClick={() => handleRemoveFile(index)}
                        >
                          <span className="text-xs font-bold">✕</span>
                        </button>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}

          <Form {...messageForm}>
            <form
              className="flex gap-2 p-4"
              onSubmit={messageForm.handleSubmit(handleSendMessage)}
            >
              <FormField
                control={messageForm.control}
                name="message"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="sr-only">Message</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={
                          isSending ? "Sending..." : "Type your message..."
                        }
                        className="max-h-32 min-h-[48px] resize-none rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm shadow-sm transition-all focus:border-blue-400 focus:bg-white focus-visible:ring-2 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50 md:text-base"
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

              <div className="flex items-end gap-2">
                <MediaUpload
                  onChange={handleAppendFile}
                  isUploading={isUploading}
                />
                <EmojiSelection onEmojiAppend={handleEmojiAppend} />
                <Button
                  type="submit"
                  className="h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 font-semibold text-white shadow-md transition-all duration-300 hover:from-blue-700 hover:to-purple-700 hover:shadow-lg disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 disabled:opacity-50"
                  disabled={isSending || isUploading}
                >
                  {isSending || isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={18} className="mr-2" />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      ) : (
        <NotJoinedModal
          roomId={roomId as string}
          userId={session?.user?.id as string}
        />
      )}

      {/* Animations */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default RoomPageClient;
