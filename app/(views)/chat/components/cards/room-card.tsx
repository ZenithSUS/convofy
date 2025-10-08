"use client";

import { Room } from "@/types/room";
import Image from "next/image";
import { useRouter } from "next/navigation";

const RoomCard = ({ room }: { room: Room }) => {
  const router = useRouter();

  const handleOpenRoom = () => {
    router.push(`/chat/${room._id}`);
  };

  return (
    <div className="flex justify-between rounded-lg border p-4 shadow-sm transition-shadow hover:shadow-md">
      <div
        className="flex cursor-pointer items-center gap-4"
        onClick={handleOpenRoom}
      >
        {room.image && (
          <Image
            src={room.image}
            alt={room.name}
            width={75}
            height={75}
            className="h-12 w-12 rounded-full object-cover"
          />
        )}

        <div className="flex flex-col gap-1 truncate md:max-w-full">
          <h2 className="text-lg font-semibold">{room.name}</h2>
          <p className="line-clamp-2 overflow-hidden text-sm text-gray-600">
            {room.description}
          </p>

          {room.lastMessage && (
            <p className="text-sm text-gray-600">
              Last message: {room.lastMessage.content}
            </p>
          )}
          <h2 className="text-sm font-semibold">
            Members: <span>{room.members.length || 0}</span>
          </h2>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;
