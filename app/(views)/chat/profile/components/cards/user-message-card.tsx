import timeFormat from "@/helper/time-format";
import { UserMessage } from "@/types/message";

import { memo, useMemo } from "react";
import MessageContent from "@/app/(views)/chat/profile/components/message-content";

interface UserMessageCardProps {
  message: UserMessage;
}

function UserMessageCard({ message }: UserMessageCardProps) {
  const isPrivate = useMemo<boolean>(() => {
    return (
      message.room.isPrivate ||
      (message.room.members.length === 2 && !message.room.name)
    );
  }, [message.room]);

  const displayName = useMemo(() => {
    return isPrivate ? message.sender.name || "Unkown User" : message.room.name;
  }, [isPrivate, message.sender.name, message.room.name]);

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-white p-4 shadow-sm hover:border-gray-300 hover:shadow-md">
      <span className="text-sm font-semibold">{displayName}</span>

      <MessageContent message={message} />
      <span className="text-xs text-gray-500">
        {timeFormat(new Date(message.createdAt))}
      </span>
    </div>
  );
}

export default memo(UserMessageCard);
