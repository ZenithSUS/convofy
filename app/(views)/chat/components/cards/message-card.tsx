"use client";

import { Message } from "@/types/message";
import { memo, useMemo, useState, useEffect, useRef } from "react";
import {
  useDeleteLiveMessage,
  useUpdateLiveMessage,
} from "@/hooks/use-message";
import DeleteMessageModal from "@/app/(views)/chat/components/modals/delete-message-modal";
import { toast } from "react-toastify";
import timeFormat from "@/helper/time-format";
import { useDeleteFile } from "@/hooks/use-delete-file";
import { extractPublicId } from "cloudinary-build-url";
import MessageContent from "../message-content";
import { Edit } from "lucide-react";
import MessageEdit from "@/app/(views)/chat/components/message-edit";
import { Session } from "@/app/(views)/chat/components/chat-header";
import Image from "next/image";

interface MessageCardProps {
  message: Message | null;
  actionType: "edit" | "view";
  session: Session;
  isThisEditing: boolean;
  isAnyEditing: boolean;
  isDetailsVisible: boolean;
  isPrivate: boolean;
  isLatestSeenMessage?: boolean; // New prop to identify latest seen message
  setIsDetailsVisible: (value: boolean) => void;
  onEditComplete: () => void;
  onCancelEdit: () => void;
  setCurrentEditId: (id: string | null) => void;
  setActionType: (type: "edit" | "view") => void;
}

function MessageCard({
  message,
  actionType,
  session,
  isThisEditing,
  isAnyEditing,
  isDetailsVisible,
  isPrivate,
  isLatestSeenMessage = false,
  onEditComplete,
  onCancelEdit,
  setCurrentEditId,
  setIsDetailsVisible,
  setActionType,
}: MessageCardProps) {
  const timeOutRef = useRef<NodeJS.Timeout | null>(null);

  const [isHovering, setIsHovering] = useState(false);

  const isUserMessage = useMemo(() => {
    if (!message) return false;
    return message.sender._id === session?.user?.id;
  }, [message, session]);

  const { deleteFile } = useDeleteFile();
  const { mutateAsync: updateMessage } = useUpdateLiveMessage();
  const { mutateAsync: deleteMessage } = useDeleteLiveMessage();

  const handleEditMessage = (action: "edit" | "view", messageId: string) => {
    if (!isUserMessage) return;

    setActionType(action);
    setCurrentEditId(messageId);
    setIsDetailsVisible(true);
  };

  const handleViewDetails = (action: "edit" | "view", id: string) => {
    if (isThisEditing && actionType === "edit") {
      return;
    }

    setActionType(action);
    setCurrentEditId(id);
    setIsDetailsVisible(!isDetailsVisible);
  };

  const isEditingMessage = useMemo(
    () => message?.type === "text" && isThisEditing && actionType === "edit",
    [message?.type, isThisEditing, actionType],
  );

  const isUserSeenMessage = useMemo(() => {
    if (!message) return false;
    return message.status.seenBy.some((user) => user._id === session?.user?.id);
  }, [message, session?.user?.id]);

  const seenUsers = useMemo<string>(() => {
    if (!message) return "";

    const totalSeenUsers = message.status.seenBy.length;

    if (totalSeenUsers <= 2) {
      return message.status.seenBy
        .map((user) => (user.name === session?.user?.name ? "You" : user.name))
        .join(" & ");
    }

    return totalSeenUsers > 2
      ? `${message.status.seenBy
          .slice(0, 2)
          .map((u) => u.name.split(" ")[0])
          .join(", ")} + ${totalSeenUsers - 2}`
      : "";
  }, [message, session?.user?.name]);

  const isSeenByUser = useMemo(() => {
    if (!message || !isPrivate) return false;

    // Check if any user other than the sender has seen the message
    const hasOtherUserSeen = message.status.seenBy.some(
      (user) => user._id !== message.sender._id,
    );

    return hasOtherUserSeen;
  }, [message, isPrivate]);

  // Get seen by users
  const seenByOthers = useMemo(() => {
    if (!message) return [];
    return message.status.seenBy.filter(
      (user) => user._id !== message.sender._id,
    );
  }, [message]);

  const handleDeleteClick = async () => {
    if (!message) return;
    try {
      if (message.type === "file" || message.type === "image") {
        let publicId = extractPublicId(message.content);
        publicId = decodeURIComponent(publicId);
        publicId = publicId.replace(/\.[^/.]+$/, "");

        await Promise.all([deleteFile(publicId), deleteMessage(message._id)]);
        toast.success("Message deleted successfully");
        return;
      }

      await deleteMessage(message._id);
      toast.success("Message deleted successfully");
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    } finally {
      setIsDetailsVisible(false);
      setCurrentEditId(null);
    }
  };

  const onEditMessage = async (id: string, content: string) => {
    try {
      if (!message) return;
      await updateMessage({ id, content });
      onEditComplete();
      toast.success("Message updated successfully");
    } catch (error) {
      console.error("Error updating message:", error);
      toast.error("Failed to update message");
    } finally {
      setIsDetailsVisible(false);
      setCurrentEditId(null);
    }
  };

  const editMessageValues = useMemo(() => {
    if (!message) return null;
    return {
      id: message._id,
      content: message.content,
    };
  }, [message]);

  // Show details if visible OR if this message is being edited
  const shouldShowDetails =
    isDetailsVisible || (isThisEditing && actionType === "edit");

  useEffect(() => {
    // Hide details when another message is being edited
    if (isAnyEditing && !isThisEditing) {
      if (timeOutRef.current) {
        clearTimeout(timeOutRef.current);
        timeOutRef.current = null;
      }
      return;
    }

    // Clear any existing timeout
    if (timeOutRef.current) {
      clearTimeout(timeOutRef.current);
      timeOutRef.current = null;
    }

    // Set timeout to auto-hide details only for view action

    if (isDetailsVisible) {
      timeOutRef.current = setTimeout(() => {
        setCurrentEditId(null);
      }, 5000);
    }

    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (timeOutRef.current) {
        clearTimeout(timeOutRef.current);
        timeOutRef.current = null;
      }
    };
  }, [isAnyEditing, isThisEditing, isDetailsVisible, setCurrentEditId]);

  if (!message) return null;

  return (
    <div className="group flex flex-col gap-2">
      {/* Timestamp with enhanced styling */}
      {shouldShowDetails && (
        <div
          className={`flex items-center gap-2 transition-opacity duration-200 ${
            message.sender._id === session.user.id ? "self-end" : "self-start"
          }`}
        >
          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            {timeFormat(new Date(message.createdAt))}
          </span>
          {message.isEdited && (
            <span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700 italic dark:bg-blue-900 dark:text-blue-300">
              edited
            </span>
          )}
        </div>
      )}

      <div
        className={`flex items-end gap-2 ${
          message.sender._id === session?.user?.id
            ? "ml-auto flex-row-reverse"
            : "mr-auto flex-row"
        }`}
      >
        {/* Enhanced Options Menu */}
        {isUserMessage && shouldShowDetails && (
          <div className="animate-in fade-in slide-in-from-bottom-2 mb-1 flex items-center gap-1 duration-200">
            <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-md dark:border-gray-700 dark:bg-gray-800">
              <DeleteMessageModal onDelete={handleDeleteClick} />
              {message.type === "text" && !isEditingMessage && (
                <button
                  onClick={() => handleEditMessage("edit", message._id)}
                  className="group rounded-md p-2 transition-colors duration-200 hover:bg-blue-50 dark:hover:bg-blue-900"
                  title="Edit message"
                >
                  <Edit className="h-4 w-4 text-gray-600 group-hover:text-blue-600 dark:text-gray-400 dark:group-hover:text-blue-400" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Message Bubble */}
        <div className="flex flex-col gap-2">
          <div
            onClick={() => handleViewDetails("view", message._id)}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className={`relative max-w-sm rounded-2xl px-4 py-2.5 shadow-sm transition-all duration-200 ${
              message.sender._id === session?.user?.id
                ? "rounded-br-sm bg-linear-to-br from-blue-400 to-blue-500 text-white dark:bg-linear-to-br dark:from-blue-700 dark:to-blue-600"
                : "rounded-bl-sm border border-gray-200 bg-white text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            } ${
              isHovering && !isEditingMessage
                ? message.sender._id === session?.user?.id
                  ? "scale-[1.02] shadow-md"
                  : "scale-[1.02] border-gray-300 shadow-md dark:border-gray-600"
                : ""
            } ${isEditingMessage ? "ring-2 ring-blue-400 dark:ring-blue-500" : ""}`}
          >
            {/* Sender name for non-user messages */}
            {message.sender._id !== session?.user?.id && !isPrivate && (
              <div className="mb-1 text-xs font-semibold text-gray-600">
                {message.sender.name}
              </div>
            )}

            {/* Message content */}
            {isEditingMessage && editMessageValues ? (
              <MessageEdit
                editMessage={editMessageValues}
                onEditMessage={onEditMessage}
                onCancelEdit={onCancelEdit}
              />
            ) : (
              <MessageContent message={message} />
            )}

            {/* Message tail */}
            <div
              className={`absolute -bottom-2 h-0 w-0 ${
                message.sender._id === session?.user?.id
                  ? "right-0 border-t-12 border-l-12 border-t-blue-500 border-l-transparent dark:border-t-blue-600 dark:border-l-transparent"
                  : "left-0 border-t-12 border-r-12 border-t-white border-r-transparent dark:border-t-gray-800 dark:border-r-transparent"
              }`}
            />
          </div>

          {/* Avatar bubbles for latest seen message - Shows for all messages */}
          {isLatestSeenMessage && isUserMessage && seenByOthers.length > 0 && (
            <div
              className={`animate-in fade-in slide-in-from-bottom-1 flex items-center gap-1 duration-200 ${
                message.sender._id === session?.user?.id
                  ? "self-end"
                  : "self-start"
              }`}
            >
              <div className="flex -space-x-2">
                {seenByOthers.slice(0, 5).map((user, index) => (
                  <div
                    key={user._id}
                    className="relative"
                    style={{ zIndex: seenByOthers.length - index }}
                    title={user.name}
                  >
                    {user.avatar ? (
                      <Image
                        src={user.avatar}
                        alt={user.name}
                        width={20}
                        height={20}
                        className="h-5 w-5 rounded-full border-2 border-white object-cover shadow-sm"
                      />
                    ) : (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-linear-to-br from-blue-400 to-blue-600 text-[10px] font-medium text-white shadow-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                ))}
                {seenByOthers.length > 5 && (
                  <div
                    className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-gray-400 text-[9px] font-semibold text-white shadow-sm"
                    title={`+${seenByOthers.length - 5} more`}
                  >
                    +{seenByOthers.length - 5}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {shouldShowDetails && isUserSeenMessage && (
        <h1
          className={`text-xs text-gray-400 ${message.sender._id === session?.user?.id ? "self-end" : "self-start"}`}
        >
          {isPrivate
            ? isSeenByUser
              ? "Seen"
              : "Delivered"
            : seenByOthers.length > 0
              ? `Seen By ${seenUsers}`
              : "Delivered"}
        </h1>
      )}
    </div>
  );
}

export default memo(MessageCard);
