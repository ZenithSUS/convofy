"use client";

import { RoomContent } from "@/types/room";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { useMemo } from "react";
import timeFormat from "@/helper/time-format";

interface RoomCardProps {
  room: RoomContent;
  currentUserId: string;
  isSearchMode?: boolean;
}

const RoomCard = ({ room, currentUserId, isSearchMode }: RoomCardProps) => {
  const router = useRouter();

  const handleOpenRoom = () => {
    router.push(`/chat/${room._id}`);
  };

  const isPrivate = useMemo<boolean>(() => {
    return room.isPrivate || (room.members.length === 2 && !room.name);
  }, [room]);

  const otherUser = isPrivate
    ? room.members.find((m) => m._id !== currentUserId)
    : null;

  const displayName = isPrivate ? otherUser?.name || "Unknown User" : room.name;

  const displayImage = isPrivate
    ? otherUser?.avatar || "/default-avatar.png"
    : room.image || "/default-avatar.png";

  const isAvailable = useMemo<boolean>(() => {
    if (!isPrivate || !otherUser) return false;
    return otherUser.isAvailable;
  }, [isPrivate, otherUser]);

  const notSeen = useMemo<boolean>(() => {
    if (!room.lastMessage?.status) return false;

    return !room.lastMessage.status.seenBy.includes(currentUserId);
  }, [room, currentUserId]);

  if (!room) return null;

  return (
    <div
      className="flex cursor-pointer justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-gray-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
      onClick={handleOpenRoom}
    >
      <div className="flex min-w-0 flex-1 items-start gap-4">
        {/* Avatar / Room Image */}
        <div className="relative shrink-0">
          <Image
            src={displayImage}
            alt={displayName}
            width={48}
            height={48}
            className="h-12 w-12 rounded-full object-cover"
          />
          {isAvailable && isPrivate && (
            <div
              className={`ring-background absolute right-0 bottom-0 h-3 w-3 rounded-full ${otherUser?.status === "online" ? "bg-green-500 ring-2 dark:bg-green-400" : "bg-gray-400 ring-2 dark:bg-gray-600"}`}
            />
          )}
        </div>

        {/* Chat Info */}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h2 className="truncate text-lg font-semibold text-gray-900 dark:text-gray-100">
            {displayName}
          </h2>

          {room.description && !isPrivate && (
            <p className="line-clamp-2 text-sm wrap-break-word text-gray-600 dark:text-gray-300">
              {room.description}
            </p>
          )}

          {!isSearchMode && room.lastMessage && (
            <p
              className={`truncate text-sm ${notSeen ? "font-bold text-gray-900 dark:text-gray-100" : "text-gray-600 dark:text-gray-400"}`}
            >
              <span className="font-medium">
                {timeFormat(new Date(room.lastMessage.createdAt))}
              </span>
              {" - "}
              {room.lastMessage.type === "text"
                ? room.lastMessage.content
                : room.lastMessage.type === "file"
                  ? "Sent a file"
                  : room.lastMessage.type === "image"
                    ? "Sent an image"
                    : "N/A"}
            </p>
          )}

          {/* Member info (for groups only) */}
          {!isPrivate && (
            <div className="flex gap-1">
              <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                <Users className="h-4 w-4" />
                <span className="font-medium">{room.members.length || 0}</span>
                <span className="text-gray-500 dark:text-gray-400">
                  {room.members.length === 1 ? "member" : "members"}
                </span>
              </div>

              <div className="flex w-full flex-1 shrink-0 flex-row gap-1">
                {Array.from(room.members)
                  .slice(0, 3)
                  .map((member) => (
                    <div key={member._id} className="shrink-0">
                      <Image
                        src={member.avatar || "/default-avatar.png"}
                        alt={member.name}
                        width={24}
                        height={24}
                        className="h-6 w-6 rounded-full object-cover"
                      />
                    </div>
                  ))}
                {room.members.length > 3 && (
                  <div className="flex shrink-0 items-center">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      +{room.members.length - 3}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomCard;
