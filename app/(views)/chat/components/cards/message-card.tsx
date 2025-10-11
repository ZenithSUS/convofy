"use client";

import { Message } from "@/types/message";
import { Session } from "next-auth";
import { memo, useMemo, useRef, useState, useEffect } from "react";
import { useDeleteLiveMessage } from "@/hooks/use-message";
import DeleteMessageModal from "@/app/(views)/chat/components/modals/delete-message-modal";
import { toast } from "react-toastify";
import timeFormat from "@/helper/time-format";
import { useDeleteFile } from "@/hooks/use-delete-file";
import { extractPublicId } from "cloudinary-build-url";
import MessageContent from "../message-content";

interface Props {
  message: Message | null;
  session: Session;
}

function MessageCard({ message, session }: Props) {
  const [isDeleteVisible, setIsDeleteVisible] = useState(false);
  const [isTimeVisible, setIsTimeVisible] = useState(false);
  const [isHoveringMessage, setIsHoveringMessage] = useState(false);
  const [isHoveringIcon, setIsHoveringIcon] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isUserMessage = useMemo(() => {
    if (!message) return false;
    return message.sender._id === session?.user?.id;
  }, [message, session]);

  const { deleteFile } = useDeleteFile();
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

    if (isHoveringMessage || isHoveringIcon) {
      // Show immediately when hovering
      setIsTimeVisible(true);
      if (isUserMessage) {
        setIsDeleteVisible(true);
      }
    } else {
      // Hide after delay when not hovering
      timeoutRef.current = setTimeout(() => {
        setIsTimeVisible(false);
        setIsDeleteVisible(false);
      }, 1000);
    }
  }, [isHoveringMessage, isHoveringIcon, isUserMessage]);

  const handleMouseEnterMessage = () => {
    setIsHoveringMessage(true);
  };

  const handleMouseLeaveMessage = () => {
    setIsHoveringMessage(false);
  };

  const handleMouseEnterIcon = () => {
    setIsHoveringIcon(true);
  };

  const handleMouseLeaveIcon = () => {
    setIsHoveringIcon(false);
  };

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
      setIsDeleteVisible(false);
      setIsTimeVisible(false);
    }
  };

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
        {isDeleteVisible && (
          <div
            className="mb-4"
            onMouseEnter={handleMouseEnterIcon}
            onMouseLeave={handleMouseLeaveIcon}
          >
            <DeleteMessageModal onDelete={handleDeleteClick} />
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
          <MessageContent message={message} />
        </div>
      </div>
    </div>
  );
}

export default memo(MessageCard);
