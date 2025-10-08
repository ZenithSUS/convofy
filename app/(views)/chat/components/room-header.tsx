"use client";

import { Room } from "@/types/room";
import { ArrowBigLeftDashIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface RoomHeaderProps {
  room: Room;
}

function RoomHeader({ room }: RoomHeaderProps) {
  const router = useRouter();

  if (!room) return null;

  return (
    <div className="mb-4 flex items-center justify-between gap-2 border-b px-4 py-2">
      <div className="flex items-center gap-2">
        {room.image && (
          <Image
            src={room.image}
            alt={room.name}
            width={75}
            height={75}
            className="h-12 w-12 rounded-full object-fill"
          />
        )}
        <h1 className="text-2xl font-bold">{room.name || "Room Chat"}</h1>
      </div>

      <ArrowBigLeftDashIcon
        className="h-6 w-6 cursor-pointer"
        onClick={() => router.push("/chat")}
      />
    </div>
  );
}

export default RoomHeader;
