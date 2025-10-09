"use client";

import { Message } from "@/types/message";
import { Session } from "next-auth";
import { memo, useMemo, useRef, useState } from "react";
import { useDeleteLiveMessage } from "@/hooks/use-message";
import DeleteMessageModal from "@/app/(views)/chat/components/modals/delete-message-modal";
import { toast } from "react-toastify";

interface Props {
  message: Message | null;
  session: Session;
}

function MessageCard({ message, session }: Props) {
  const [isDeleteVisible, setIsDeleteVisible] = useState(false);
  const [isHoveringIcon, setIsHoveringIcon] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isUserMessage = useMemo(() => {
    if (!message) return false;
    return message.sender._id === session?.user?.id;
  }, [message, session]);

  const { mutateAsync: deleteMessage } = useDeleteLiveMessage();

  const hideDeleteIcon = () => setIsDeleteVisible(false);

  const showDeleteIcon = () => {
    if (isUserMessage) setIsDeleteVisible(true);
  };

  const handleMouseEnterMessage = () => {
    showDeleteIcon();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(hideDeleteIcon, 1000);
  };

  const handleMouseLeaveMessage = () => {
    if (!isHoveringIcon) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(hideDeleteIcon, 1000);
    }
  };

  const handleMouseEnterIcon = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsHoveringIcon(true);
  };

  const handleMouseLeaveIcon = () => {
    setIsHoveringIcon(false);
    timeoutRef.current = setTimeout(hideDeleteIcon, 1000);
  };

  const handleDeleteClick = async () => {
    if (!message) return;
    try {
      await deleteMessage(message._id);
      toast.success("Message deleted");
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    } finally {
      setIsDeleteVisible(false);
    }
  };

  if (!message) return null;

  return (
    <div className="flex flex-row items-center justify-center gap-2">
      <div
        className={`mb-4 w-fit max-w-sm rounded-md ${
          message.sender._id === session?.user?.id
            ? "ml-auto bg-slate-200 p-2 dark:bg-slate-800"
            : "mr-auto bg-slate-300 p-2 dark:bg-slate-700"
        }`}
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

export default memo(MessageCard);
