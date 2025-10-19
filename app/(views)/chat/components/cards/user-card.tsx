"use client";

import { useGetOrCreatePrivateRoom } from "@/hooks/use-rooms";
import { RoomContent } from "@/types/room";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { toast } from "react-toastify";

interface UserCardProps {
  user: RoomContent;
  userId: string;
}

function UserCard({ user, userId }: UserCardProps) {
  const router = useRouter();
  const { mutateAsync: getOrCreatePrivateRoom, isPending } =
    useGetOrCreatePrivateRoom();

  const isBusy = useMemo<boolean>(() => {
    return isPending;
  }, [isPending]);

  const handleGetOrCreatePrivateRoom = async () => {
    if (isBusy) return;
    try {
      const room = await getOrCreatePrivateRoom({
        userA: userId,
        userB: user._id,
      });

      router.push(`/chat/${room._id}`);
    } catch (error) {
      toast.error("Failed to start chat. Please try again.");
      console.error("Error starting chat:", error);
    }
  };

  return (
    <div
      className="flex cursor-pointer items-center gap-3 rounded-lg border bg-white p-3 shadow-sm hover:shadow-md"
      onClick={handleGetOrCreatePrivateRoom}
    >
      <Image
        src={user.avatar || "/default-avatar.png"}
        alt={user.name}
        width={40}
        height={40}
        className="h-10 w-10 rounded-full"
      />
      <span className="font-medium text-gray-700">{user.name}</span>
      <span className="ml-auto text-xs text-gray-500">Start chat</span>
    </div>
  );
}

export default UserCard;
