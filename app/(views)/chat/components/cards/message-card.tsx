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

interface Props {
  message: Message | null;
  actionType: "edit" | "view";
  session: Session;
  isThisEditing: boolean;
  isAnyEditing: boolean;
  isDetailsVisible: boolean;
  isPrivate: boolean;
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
  onEditComplete,
  onCancelEdit,
  setCurrentEditId,
  setIsDetailsVisible,
  setActionType,
}: Props) {
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
          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
            {timeFormat(new Date(message.createdAt))}
          </span>
          {message.isEdited && (
            <span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700 italic">
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
            <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-md">
              <DeleteMessageModal onDelete={handleDeleteClick} />
              {message.type === "text" && !isEditingMessage && (
                <button
                  onClick={() => handleEditMessage("edit", message._id)}
                  className="group rounded-md p-2 transition-colors duration-200 hover:bg-blue-50"
                  title="Edit message"
                >
                  <Edit className="h-4 w-4 text-gray-600 group-hover:text-blue-600" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Message Bubble */}
        <div
          onClick={() => handleViewDetails("view", message._id)}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          className={`relative max-w-sm rounded-2xl px-4 py-2.5 shadow-sm transition-all duration-200 ${
            message.sender._id === session?.user?.id
              ? "rounded-br-sm bg-linear-to-br from-blue-400 to-blue-500 text-white"
              : "rounded-bl-sm border border-gray-200 bg-white text-gray-800"
          } ${
            isHovering && !isEditingMessage
              ? message.sender._id === session?.user?.id
                ? "scale-[1.02] shadow-md"
                : "scale-[1.02] border-gray-300 shadow-md"
              : ""
          } ${isEditingMessage ? "ring-2 ring-blue-400" : ""}`}
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
                ? "right-0 border-t-12 border-l-12 border-t-blue-500 border-l-transparent"
                : "left-0 border-t-12 border-r-12 border-t-white border-r-transparent"
            }`}
          />
        </div>
      </div>
    </div>
  );
}

export default memo(MessageCard);
