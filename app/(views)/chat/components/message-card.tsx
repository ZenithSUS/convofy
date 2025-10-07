"use client";

import { Message } from "@/types/message";
import { Session } from "next-auth";
import { useMemo, useRef, useState } from "react";
import { useDeleteLiveMessage } from "@/hooks/use-message";
import DeleteMessageModal from "./modals/delete-message-modal";

interface Props {
  message: Message;
  session: Session;
}

function MessageCard({ message, session }: Props) {
  const [isDeleteVisible, setIsDeleteVisible] = useState(false);
  const [isHoveringIcon, setIsHoveringIcon] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isUserMessage = useMemo(() => {
    return message.sender._id === session?.user?.id;
  }, [message, session]);

  const deleteMessage = useDeleteLiveMessage();

  const hideDeleteIcon = () => {
    setIsDeleteVisible(false);
  };

  const showDeleteIcon = () => {
    if (isUserMessage) {
      setIsDeleteVisible(true);
    }
  };

  const handleMouseEnterMessage = () => {
    showDeleteIcon();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(hideDeleteIcon, 1000);
  };

  const handleMouseLeaveMessage = () => {
    if (!isHoveringIcon) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(hideDeleteIcon, 1000);
    }
  };

  const handleMouseEnterIcon = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsHoveringIcon(true);
  };

  const handleMouseLeaveIcon = () => {
    setIsHoveringIcon(false);
    timeoutRef.current = setTimeout(hideDeleteIcon, 1000);
  };

  const handleDeleteClick = () => {
    deleteMessage.mutate(message._id);
    setIsDeleteVisible(false);
  };

  return (
    <div className="flex flex-row items-center justify-center gap-2">
      <div
        className={`mb-4 w-fit rounded-md ${message.sender._id === session?.user?.id ? "ml-auto bg-slate-200 p-2 dark:bg-slate-800" : "mr-auto bg-slate-300 p-2 dark:bg-slate-700"}`}
        onMouseEnter={handleMouseEnterMessage}
        onMouseLeave={handleMouseLeaveMessage}
      >
        <strong>{message.sender.name.split(" ")[0]}:</strong> {message.content}
      </div>
      {isDeleteVisible && (
        <div
          className="mb-4"
          onMouseEnter={handleMouseEnterIcon}
          onMouseLeave={handleMouseLeaveIcon}
        >
          <DeleteMessageModal onDelete={handleDeleteClick} />
        </div>
      )}
    </div>
  );
}

export default MessageCard;
