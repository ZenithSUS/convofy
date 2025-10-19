"use client";

import { RoomContent } from "@/types/room";
import { ArrowBigLeftDashIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

interface RoomHeaderProps {
  room: RoomContent;
  userId: string;
}

function RoomHeader({ room, userId }: RoomHeaderProps) {
  const router = useRouter();

  const isPrivate = useMemo<boolean>(() => {
    return room.isPrivate || (room.members.length === 2 && !room.name);
  }, [room]);

  const otherUser = useMemo(
    () => (isPrivate ? room.members.find((m) => m._id !== userId) : null),
    [room, userId, isPrivate],
  );

  const displayName = useMemo(() => {
    return isPrivate ? otherUser?.name || "Unknown User" : room.name;
  }, [room, otherUser, isPrivate]);

  const displayImage = useMemo(
    () =>
      isPrivate
        ? otherUser?.avatar || "/default-avatar.png"
        : room.image || "/default-avatar.png",
    [room, otherUser, isPrivate],
  );

  if (!room) return null;

  return (
    <div className="mb-4 flex items-center justify-between gap-2 border-b px-4 py-2">
      <div className="flex items-center gap-2">
        {displayImage && (
          <Image
            src={displayImage}
            alt={displayName}
            width={75}
            height={75}
            className="h-12 w-12 rounded-full object-fill"
          />
        )}
        <h1 className="text-2xl font-bold">{displayName}</h1>
      </div>

      <ArrowBigLeftDashIcon
        className="h-6 w-6 cursor-pointer"
        onClick={() => router.push("/chat")}
      />
    </div>
  );
}

export default RoomHeader;
