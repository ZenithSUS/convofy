"use client";

import { Message } from "@/types/message";
import { memo, useMemo, useState, useEffect, useRef, useCallback } from "react";
import {
  useDeleteLiveMessage,
  useUpdateLiveMessage,
} from "@/hooks/use-message";
import DeleteMessageModal from "@/app/(views)/chat/[roomId]/components/modals/delete-message-modal";
import { toast } from "react-toastify";
import timeFormat from "@/helper/time-format";
import { useDeleteFile } from "@/hooks/use-delete-file";
import { extractPublicId } from "cloudinary-build-url";
import MessageContent from "@/app/(views)/chat/[roomId]/components/message/message-content";
import { Edit } from "lucide-react";
import MessageEdit from "@/app/(views)/chat/[roomId]/components/message/message-edit";
import { Session } from "@/app/(views)/chat/components/chatpage/chat-header";
import Image from "next/image";

interface MessageCardProps {
  message: Message | null;
  actionType: "edit" | "view";
  session: Session;
  isThisEditing: boolean;
  isAnyEditing: boolean;
  isDetailsVisible: boolean;
  isPrivate: boolean;
  isLatestSeenMessage?: boolean;
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

  const { deleteFile } = useDeleteFile();
  const { mutateAsync: updateMessage } = useUpdateLiveMessage();
  const { mutateAsync: deleteMessage } = useDeleteLiveMessage();

  // Derived state for message ownership and user info
  const messageOwnership = useMemo(() => {
    if (!message || !session?.user)
      return { isOwner: false, isAnonymous: false };

    return {
      isOwner: message.sender._id === session.user.id,
      isAnonymous: message.sender.isAnonymous,
    };
  }, [message, session?.user]);

  const seenStatus = useMemo(() => {
    if (!message) {
      return {
        seenByOthers: [],
        currentUserHasSeen: false,
        hasAnyoneSeenBesidesSender: false,
        seenCount: 0,
      };
    }

    const seenByOthers = message.status.seenBy.filter(
      (user) => user._id !== message.sender._id,
    );

    const currentUserHasSeen = message.status.seenBy.some(
      (user) => user._id === session?.user?.id,
    );

    return {
      seenByOthers,
      currentUserHasSeen,
      hasAnyoneSeenBesidesSender: seenByOthers.length > 0,
      seenCount: seenByOthers.length,
    };
  }, [message, session?.user?.id]);

  // Format seen users text for display
  const seenUsersText = useMemo(() => {
    const { seenByOthers, seenCount } = seenStatus;

    if (seenCount === 0) return "";
    if (seenCount <= 2) {
      return seenByOthers
        .map((user) => (user.name === session?.user?.name ? "You" : user.name))
        .join(" & ");
    }

    // More than 2 users
    return `${seenByOthers
      .slice(0, 2)
      .map((u) => u.name.split(" ")[0])
      .join(", ")} + ${seenCount - 2}`;
  }, [seenStatus, session?.user?.name]);

  // Determine delivery status text
  const deliveryStatusText = useMemo(() => {
    if (!seenStatus.currentUserHasSeen) return "";

    if (isPrivate) {
      return seenStatus.hasAnyoneSeenBesidesSender ? "Seen" : "Delivered";
    }

    return seenStatus.hasAnyoneSeenBesidesSender
      ? `Seen By ${seenUsersText}`
      : "Delivered";
  }, [isPrivate, seenStatus, seenUsersText]);

  const isEditingMessage = useMemo(
    () => message?.type === "text" && isThisEditing && actionType === "edit",
    [message?.type, isThisEditing, actionType],
  );

  const shouldShowDetails = isDetailsVisible || isEditingMessage;

  // Event handlers
  const handleEditMessage = useCallback(
    (action: "edit" | "view", messageId: string) => {
      if (!messageOwnership.isOwner || messageOwnership.isAnonymous) return;

      setActionType(action);
      setCurrentEditId(messageId);
      setIsDetailsVisible(true);
    },
    [messageOwnership, setActionType, setCurrentEditId, setIsDetailsVisible],
  );

  const handleViewDetails = useCallback(
    (action: "edit" | "view", id: string) => {
      if (isEditingMessage) return;

      setActionType(action);
      setCurrentEditId(id);
      setIsDetailsVisible(!isDetailsVisible);
    },
    [
      isEditingMessage,
      setActionType,
      setCurrentEditId,
      setIsDetailsVisible,
      isDetailsVisible,
    ],
  );

  const handleDeleteClick = useCallback(async () => {
    if (!message) return;

    try {
      if (message.type === "file" || message.type === "image") {
        let publicId = extractPublicId(message.content);
        publicId = decodeURIComponent(publicId);
        publicId = publicId.replace(/\.[^/.]+$/, "");

        await Promise.all([deleteFile(publicId), deleteMessage(message._id)]);
      } else {
        await deleteMessage(message._id);
      }

      toast.success("Message deleted successfully");
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    } finally {
      setIsDetailsVisible(false);
      setCurrentEditId(null);
    }
  }, [
    message,
    deleteFile,
    deleteMessage,
    setIsDetailsVisible,
    setCurrentEditId,
  ]);

  const onEditMessage = useCallback(
    async (id: string, content: string) => {
      try {
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
    },
    [updateMessage, onEditComplete, setIsDetailsVisible, setCurrentEditId],
  );

  const editMessageValues = useMemo(() => {
    if (!message) return null;
    return {
      id: message._id,
      content: message.content,
    };
  }, [message]);

  // Auto-hide details timeout effect
  useEffect(() => {
    if (isAnyEditing && !isThisEditing) {
      if (timeOutRef.current) {
        clearTimeout(timeOutRef.current);
        timeOutRef.current = null;
      }
      return;
    }

    if (timeOutRef.current) {
      clearTimeout(timeOutRef.current);
      timeOutRef.current = null;
    }

    if (isDetailsVisible) {
      timeOutRef.current = setTimeout(() => {
        setCurrentEditId(null);
      }, 5000);
    }

    return () => {
      if (timeOutRef.current) {
        clearTimeout(timeOutRef.current);
        timeOutRef.current = null;
      }
    };
  }, [isAnyEditing, isThisEditing, isDetailsVisible, setCurrentEditId]);

  if (!message) return null;

  const isOwnerMessage = messageOwnership.isOwner;

  return (
    <div className="group flex flex-col gap-2">
      {/* Timestamp */}
      {shouldShowDetails && (
        <div
          className={`flex items-center gap-2 transition-opacity duration-200 ${
            isOwnerMessage ? "self-end" : "self-start"
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
          isOwnerMessage ? "ml-auto flex-row-reverse" : "mr-auto flex-row"
        }`}
      >
        {/* Options Menu */}
        {isOwnerMessage &&
          !messageOwnership.isAnonymous &&
          shouldShowDetails && (
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
              isOwnerMessage
                ? "rounded-br-sm bg-linear-to-br from-blue-400 to-blue-500 text-white dark:bg-linear-to-br dark:from-blue-700 dark:to-blue-600"
                : "rounded-bl-sm border border-gray-200 bg-white text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            } ${
              isHovering && !isEditingMessage
                ? isOwnerMessage
                  ? "scale-[1.02] shadow-md"
                  : "scale-[1.02] border-gray-300 shadow-md dark:border-gray-600"
                : ""
            } ${isEditingMessage ? "ring-2 ring-blue-400 dark:ring-blue-500" : ""}`}
          >
            {/* Sender name for non-user messages */}
            {!isOwnerMessage && !isPrivate && (
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
                isOwnerMessage
                  ? "right-0 border-t-12 border-l-12 border-t-blue-500 border-l-transparent dark:border-t-blue-600 dark:border-l-transparent"
                  : "left-0 border-t-12 border-r-12 border-t-white border-r-transparent dark:border-t-gray-800 dark:border-r-transparent"
              }`}
            />
          </div>

          {/* Avatar bubbles for latest seen message */}
          {isLatestSeenMessage &&
            isOwnerMessage &&
            seenStatus.seenByOthers.length > 0 && (
              <div
                className={`animate-in fade-in slide-in-from-bottom-1 flex items-center gap-1 duration-200 ${
                  isOwnerMessage ? "self-end" : "self-start"
                }`}
              >
                <div className="flex -space-x-2">
                  {seenStatus.seenByOthers.slice(0, 5).map((user, index) => (
                    <div
                      key={user._id}
                      className="relative"
                      style={{ zIndex: seenStatus.seenByOthers.length - index }}
                      title={user.name}
                    >
                      {!user.isAnonymous &&
                      user.avatar &&
                      !message.room.isAnonymous ? (
                        <Image
                          src={user.avatar}
                          alt={user.name}
                          width={20}
                          height={20}
                          className="h-5 w-5 rounded-full border-2 border-white object-cover shadow-sm"
                        />
                      ) : user.isAnonymous &&
                        user.role === "user" &&
                        message.room.isAnonymous ? (
                        <Image
                          src={user.anonAvatar || "/default-avatar.png"}
                          alt={user.name}
                          width={20}
                          height={20}
                          className="h-5 w-5 rounded-full border-2 border-white object-cover shadow-sm"
                        />
                      ) : user.isAnonymous && user.role === "anonymous" ? (
                        <Image
                          src={user.anonAvatar || "/default-avatar.png"}
                          alt={user.name}
                          width={20}
                          height={20}
                          className="h-5 w-5 rounded-full border-2 border-white object-cover shadow-sm"
                        />
                      ) : user.isAnonymous &&
                        !message.room.isAnonymous &&
                        user.avatar &&
                        user.role === "user" ? (
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
                  {seenStatus.seenByOthers.length > 5 && (
                    <div
                      className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-gray-400 text-[9px] font-semibold text-white shadow-sm"
                      title={`+${seenStatus.seenByOthers.length - 5} more`}
                    >
                      +{seenStatus.seenByOthers.length - 5}
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Delivery status */}
      {shouldShowDetails && deliveryStatusText && (
        <h1
          className={`text-xs text-gray-400 ${isOwnerMessage ? "self-end" : "self-start"}`}
        >
          {deliveryStatusText}
        </h1>
      )}
    </div>
  );
}

export default memo(MessageCard);
