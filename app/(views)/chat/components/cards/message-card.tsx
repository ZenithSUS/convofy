"use client";

import { Message } from "@/types/message";
import { Session } from "next-auth";
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
import { EditIcon } from "lucide-react";
import MessageEdit from "../message-edit";

interface Props {
  message: Message | null;
  session: Session;
}

function MessageCard({ message, session }: Props) {
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);
  const [isTimeVisible, setIsTimeVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Effect to handle visibility based on hover states
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (isEditing) {
      // Hide options immediately when editing
      setIsTimeVisible(false);
      setIsOptionsVisible(false);
      return;
    }

    if (isHoveringMessage || isHoveringIcon) {
      // Show immediately when hovering
      setIsTimeVisible(true);
      if (isUserMessage) {
        setIsOptionsVisible(true);
      }
    } else {
      // Hide after delay when not hovering
      timeoutRef.current = setTimeout(() => {
        setIsTimeVisible(false);
        setIsOptionsVisible(false);
      }, 1000);
    }
  }, [isHoveringMessage, isHoveringIcon, isUserMessage, isEditing]);

  const handleMouseEnterMessage = () => {
    if (isEditing) return;
    setIsHoveringMessage(true);
  };

  const handleMouseLeaveMessage = () => {
    if (isEditing) return;
    setIsHoveringMessage(false);
  };

  const handleMouseEnterIcon = () => {
    if (isEditing) return;
    setIsHoveringIcon(true);
  };

  const handleMouseLeaveIcon = () => {
    if (isEditing) return;
    setIsHoveringIcon(false);
  };

  const handleEditMessage = () => {
    setIsEditing(true);
    setIsOptionsVisible(false);
  };

  const isEditingMessage = useMemo(
    () => message?.type === "text" && isEditing,
    [message?.type, isEditing],
  );

  const handleDeleteClick = async () => {
    if (!message) return;
    try {
      if (message.type === "file" || message.type === "image") {
        const publicId = extractPublicId(message.content);

        await Promise.all([deleteFile(publicId), deleteMessage(message._id)]);
        toast.success("Message deleted");
        return;
      }

      await deleteMessage(message._id);
      toast.success("Message deleted");
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
      setIsEditing(false);
      toast.success("Message updated");
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
    <div className="flex flex-col gap-1.5">
      {isTimeVisible && (
        <h1
          onMouseEnter={handleMouseEnterIcon}
          onMouseLeave={handleMouseLeaveIcon}
          className={`text-xs text-gray-500 ${
            message.sender._id === session.user.id ? "self-end" : "self-start"
          }`}
        >
          {timeFormat(new Date(message.createdAt))}
        </h1>
      )}
      <div
        className={`flex flex-row items-center gap-2 ${
          message.sender._id === session?.user?.id ? "ml-auto" : "mr-auto"
        }`}
      >
        {isOptionsVisible && (
          <div
            className="mb-4 flex items-center justify-center gap-1 rounded-md p-2 hover:bg-slate-200 dark:hover:bg-slate-800"
            onMouseEnter={handleMouseEnterIcon}
            onMouseLeave={handleMouseLeaveIcon}
          >
            <DeleteMessageModal onDelete={handleDeleteClick} />
            {message.type === "text" && (
              <EditIcon
                onClick={() => handleEditMessage()}
                className="h-6 w-6 cursor-pointer"
              />
            )}
          </div>
        )}
        <div
          className={`mb-4 flex w-fit max-w-sm items-center gap-1 rounded-md p-2 ${
            message.sender._id === session?.user?.id
              ? "bg-slate-200 dark:bg-slate-800"
              : "bg-slate-300 dark:bg-slate-700"
          }`}
          onMouseEnter={handleMouseEnterMessage}
          onMouseLeave={handleMouseLeaveMessage}
        >
          {/* Message content */}
          {isEditingMessage && editMessageValues ? (
            <MessageEdit
              editMessage={editMessageValues}
              onEditMessage={onEditMessage}
              setIsEditing={setIsEditing}
            />
          ) : (
            <MessageContent message={message} />
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(MessageCard);
