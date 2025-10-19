"use client";

import { RoomContent } from "@/types/room";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { useMemo } from "react";

interface RoomCardProps {
  room: RoomContent;
  currentUserId: string;
}

const RoomCard = ({ room, currentUserId }: RoomCardProps) => {
  const router = useRouter();

  const handleOpenRoom = () => {
    router.push(`/chat/${room._id}`);
  };

  // 🧠 Determine display name and image
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

  if (!room) return null;

  return (
    <div
      className="flex cursor-pointer justify-between rounded-lg border bg-white p-4 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
      onClick={handleOpenRoom}
    >
      <div className="flex min-w-0 flex-1 items-start gap-4">
        {/* Avatar / Room Image */}
        <div className="flex-shrink-0">
          <Image
            src={displayImage}
            alt={displayName}
            width={48}
            height={48}
            className="h-12 w-12 rounded-full object-cover"
          />
        </div>

        {/* Chat Info */}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h2 className="truncate text-lg font-semibold text-gray-900">
            {displayName}
          </h2>

          {room.description && !isPrivate && (
            <p className="line-clamp-2 text-sm break-words text-gray-600">
              {room.description}
            </p>
          )}

          {room.lastMessage && (
            <p className="truncate text-sm text-gray-500">
              <span className="font-medium">Last message:</span>{" "}
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
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span className="font-medium">{room.members.length || 0}</span>
                <span className="text-gray-500">
                  {room.members.length === 1 ? "member" : "members"}
                </span>
              </div>

              <div className="flex w-full flex-1 flex-shrink-0 flex-row gap-1">
                {Array.from(room.members)
                  .slice(0, 3)
                  .map((member) => (
                    <div key={member._id} className="flex-shrink-0">
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
                  <div className="flex flex-shrink-0 items-center">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
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
