"use client";

import { Message } from "@/types/message";
import { memo, useMemo, useRef, useState, useEffect } from "react";
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
  session: Session;
  isThisEditing: boolean;
  isAnyEditing: boolean;
  onEditComplete: () => void;
  onCancelEdit: () => void;
  setCurrentEditId: (id: string | null) => void;
}

function MessageCard({
  message,
  session,
  isThisEditing,
  isAnyEditing,
  onEditComplete,
  onCancelEdit,
  setCurrentEditId,
}: Props) {
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);
  const [isTimeVisible, setIsTimeVisible] = useState(false);
  const [isHoveringMessage, setIsHoveringMessage] = useState(false);
  const [isHoveringIcon, setIsHoveringIcon] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isUserMessage = useMemo(() => {
    if (!message) return false;
    return message.sender._id === session?.user?.id;
  }, [message, session]);

  const { deleteFile } = useDeleteFile();
  const { mutateAsync: updateMessage } = useUpdateLiveMessage();
  const { mutateAsync: deleteMessage } = useDeleteLiveMessage();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (isAnyEditing) {
      setIsTimeVisible(false);
      setIsOptionsVisible(false);
      return;
    }

    if (isHoveringMessage || isHoveringIcon) {
      setIsTimeVisible(true);
      if (isUserMessage) {
        setIsOptionsVisible(true);
      }
    } else {
      timeoutRef.current = setTimeout(() => {
        setIsTimeVisible(false);
        setIsOptionsVisible(false);
      }, 1000);
    }
  }, [isHoveringMessage, isHoveringIcon, isUserMessage, isAnyEditing]);

  const handleMouseEnterMessage = () => {
    if (isAnyEditing) return;
    setIsHoveringMessage(true);
  };

  const handleMouseLeaveMessage = () => {
    if (isAnyEditing) return;
    setIsHoveringMessage(false);
  };

  const handleMouseEnterIcon = () => {
    if (isAnyEditing) return;
    setIsHoveringIcon(true);
  };

  const handleMouseLeaveIcon = () => {
    if (isAnyEditing) return;
    setIsHoveringIcon(false);
  };

  const handleEditMessage = (messageId: string) => {
    setCurrentEditId(messageId);
    setIsOptionsVisible(false);
  };

  const isEditingMessage = useMemo(
    () => message?.type === "text" && isThisEditing,
    [message?.type, isThisEditing],
  );

  const handleDeleteClick = async () => {
    if (!message) return;
    try {
      if (message.type === "file" || message.type === "image") {
        const publicId = extractPublicId(message.content);

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
      setIsOptionsVisible(false);
      setIsTimeVisible(false);
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
      setIsOptionsVisible(false);
      setIsTimeVisible(false);
    }
  };

  const editMessageValues = useMemo(() => {
    if (!message) return null;
    return {
      id: message._id,
      content: message.content,
    };
  }, [message]);

  if (!message) return null;

  return (
    <div className="group flex flex-col gap-2">
      {/* Timestamp with enhanced styling */}
      {isTimeVisible && (
        <div
          onMouseEnter={handleMouseEnterIcon}
          onMouseLeave={handleMouseLeaveIcon}
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
        {isOptionsVisible && (
          <div
            className="animate-in fade-in slide-in-from-bottom-2 mb-1 flex items-center gap-1 duration-200"
            onMouseEnter={handleMouseEnterIcon}
            onMouseLeave={handleMouseLeaveIcon}
          >
            <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-md">
              <DeleteMessageModal onDelete={handleDeleteClick} />
              {message.type === "text" && (
                <button
                  onClick={() => handleEditMessage(message._id)}
                  className="group rounded-md p-2 transition-colors duration-200 hover:bg-blue-50"
                  title="Edit message"
                >
                  <Edit className="h-4 w-4 text-gray-600 group-hover:text-blue-600" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Message Bubble */}
        <div
          className={`relative max-w-sm rounded-2xl px-4 py-2.5 shadow-sm transition-all duration-200 ${
            message.sender._id === session?.user?.id
              ? "rounded-br-sm bg-gradient-to-br from-blue-400 to-blue-500 text-white"
              : "rounded-bl-sm border border-gray-200 bg-white text-gray-800"
          } ${
            isHoveringMessage
              ? message.sender._id === session?.user?.id
                ? "scale-[1.02] shadow-md"
                : "scale-[1.02] border-gray-300 shadow-md"
              : ""
          }`}
          onMouseEnter={handleMouseEnterMessage}
          onMouseLeave={handleMouseLeaveMessage}
        >
          {/* Sender name for non-user messages */}
          {message.sender._id !== session?.user?.id && (
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
                ? "right-0 border-t-[12px] border-l-[12px] border-t-blue-500 border-l-transparent"
                : "left-0 border-t-[12px] border-r-[12px] border-t-white border-r-transparent"
            }`}
          />
        </div>
      </div>
    </div>
  );
}

export default memo(MessageCard);
