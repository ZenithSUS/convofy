"use client";
// React
import { ChangeEvent, useCallback, useMemo, useState } from "react";
import { toast } from "react-toastify";

// Zod, Tanstack and React Hook Form
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

// Next
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

// Hooks
import { useUploadImage } from "@/hooks/use-upload";
import { useGetRoomById } from "@/hooks/use-rooms";
import {
  useCheckTyping,
  useGetMessagesByRoom,
  useSendLiveMessage,
} from "@/hooks/use-message";
import useChannel from "@/hooks/use-channel";

// Types
import { User } from "@/types/user";
import { AxiosError } from "axios/";
import { CreateMessage, Message } from "@/types/message";
import { FileInfo } from "@/types/file";
import { RoomContent } from "@/types/room";

// Components
import { Button } from "@/components/ui/button";
import NotJoinedModal from "@/app/(views)/chat/components/modals/not-joined-modal";
import MessageCard from "@/app/(views)/chat/components/cards/message-card";
import ErrorMessage from "@/components/ui/error-message";
import RoomHeader from "@/app/(views)/chat/components/room-header";
import TypingIndicator from "@/app/(views)/chat/[roomId]/components/typing-indicator";
import ConnectionStatus from "@/app/(views)/chat/[roomId]/components/connection-status";
import MediaPreview from "@/app/(views)/chat/[roomId]/components/media-preview";
import MessageForm from "@/app/(views)/chat/[roomId]/components/message-form";
import LoadingConvo from "@/app/(views)/chat/[roomId]/components/loading-convo";
import StartMessage from "@/app/(views)/chat/[roomId]/components/start-message";
import { Session } from "@/app/(views)/chat/components/chat-header";
import useHybridSession from "@/hooks/use-hybrid-session";

const schemaMessage = z.object({
  message: z.string(),
});

type FormData = z.infer<typeof schemaMessage>;

function RoomPageClient({ serverSession }: { serverSession: Session }) {
  const { roomId }: { roomId: string } = useParams();
  const { session } = useHybridSession(serverSession);

  const messageForm = useForm<FormData>({
    resolver: zodResolver(schemaMessage),
    defaultValues: {
      message: "",
    },
  });

  const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);
  const [currentEditId, setCurrentEditId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [, setIsDetailsVisible] = useState<boolean>(false);
  const [actionType, setActionType] = useState<"edit" | "delete" | "view">(
    "view",
  );

  const {
    data: room,
    isLoading: roomLoading,
    isFetching: isFetchingRoom,
    isError: roomError,
    error: roomErrorData,
    refetch: refetchRoom,
  } = useGetRoomById(roomId as string);

  const roomData = useMemo(() => room, [room]);

  const {
    isMountedRef,
    connectionStatus,
    isTypingRef,
    typingIndicatorRef,
    typingUsers,
    isMember,
    typingTimeoutRef,
    queryClient,
  } = useChannel({
    session,
    roomId,
    room: roomData,
  });

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
  } = useGetMessagesByRoom(roomId as string, 5, isMember);

  const { mutateAsync: sendMessage } = useSendLiveMessage();
  const { mutateAsync: typingSignal } = useCheckTyping();
  const { uploadImage, isUploading } = useUploadImage();

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
          user: session.user! as Omit<User, "_id" | "activeSessions"> & {
            id: string;
          },
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
          user: session.user! as Omit<User, "_id" | "activeSessions"> & {
            id: string;
          },
          isTyping: false,
        });
      } catch (error) {
        console.error("Failed to send stop typing signal:", error);
      }
    }
  };

  if (!isAllDataLoaded || isAllLoading) {
    return <LoadingConvo />;
  }

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <RoomHeader
        room={roomData as RoomContent}
        userId={session?.user.id as string}
      />

      {/* Enhanced Connection Status Banner */}
      {connectionStatus !== "connected" && (
        <ConnectionStatus connectionStatus={connectionStatus} />
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
          <StartMessage />
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
                  isDetailsVisible={
                    currentEditId === msg._id && actionType === "view"
                  }
                  actionType={actionType}
                  setActionType={setActionType}
                  setIsDetailsVisible={setIsDetailsVisible}
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
          <TypingIndicator
            typingUsers={typingUsers}
            typingIndicatorRef={typingIndicatorRef}
          />
        )}
      </div>

      {/* Enhanced Input Area */}
      {isMember ? (
        <div className="border-t bg-white shadow-lg">
          {/* File Preview Section */}
          {selectedFiles.length > 0 && (
            <MediaPreview
              selectedFiles={selectedFiles}
              setSelectedFiles={setSelectedFiles}
              handleRemoveFile={handleRemoveFile}
            />
          )}

          {/* Message Form Section */}
          <MessageForm
            messageForm={messageForm}
            isSending={isSending}
            isUploading={isUploading}
            handleSendMessage={handleSendMessage}
            handleTypingUser={handleTypingUser}
            handleStopTypingUser={handleStopTypingUser}
            handleEmojiAppend={handleEmojiAppend}
            handleAppendFile={handleAppendFile}
          />
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
