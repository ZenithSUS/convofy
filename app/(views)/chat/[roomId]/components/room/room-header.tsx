"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import client from "@/lib/axios";
import { RoomContent } from "@/types/room";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { toast } from "react-toastify";

interface RoomHeaderProps {
  room: RoomContent;
  userId: string;
  isAnonymous: boolean;
}

function RoomHeader({ room, userId, isAnonymous }: RoomHeaderProps) {
  const router = useRouter();

  const isPrivate = useMemo<boolean>(() => {
    return room.isPrivate || (room.members.length === 2 && !room.name);
  }, [room]);

  const otherUser = useMemo(
    () => (isPrivate ? room.members.find((m) => m._id !== userId) : null),
    [room, userId, isPrivate],
  );

  const displayName = useMemo(() => {
    if (isPrivate && otherUser?.isAnonymous && otherUser.role === "user") {
      return room.isAnonymous
        ? otherUser.anonAlias || "Anonymous User"
        : otherUser?.name || "Anonymous User";
    }

    if (isPrivate && otherUser?.isAnonymous && otherUser.role === "anonymous") {
      return otherUser?.name || "Anonymous User";
    }

    return room.name || "Unknown Room";
  }, [room, otherUser, isPrivate]);

  const handleLeave = useCallback(
    async (isAnonymous: boolean) => {
      try {
        if (isAnonymous) {
          toast.promise(
            async () => {
              await client.post("/match/leave", { roomId: room._id });
            },
            {
              pending: "Leaving room...",
              success: "Room left successfully",
              error: "Failed to leave room",
            },
          );
        }

        return router.push("/chat");
      } catch (error) {
        console.error("[LEAVE ROOM ERROR]", error);
        toast.error("Failed to leave room");
      }
    },
    [router, room._id],
  );

  const isAvailable = useMemo(() => {
    return isPrivate ? otherUser?.isAvailable || false : false;
  }, [otherUser, isPrivate]);

  const displayImage = useMemo(() => {
    if (isPrivate && otherUser?.isAnonymous) {
      return room.isAnonymous
        ? otherUser.anonAvatar || "/default-avatar.png"
        : otherUser?.avatar || "/default-avatar.png";
    }

    if (isPrivate && !otherUser?.isAnonymous) {
      return otherUser?.avatar || "/default-avatar.png";
    }

    return room.image || "/default-avatar.png";
  }, [room, otherUser, isPrivate]);

  const isOnline = useMemo(() => {
    return isPrivate ? otherUser?.status === "online" : false;
  }, [otherUser, isPrivate]);

  if (!room) return null;

  return (
    <div className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-10 backdrop-blur">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        {/* Left section - Back button and Room info */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            onClick={() => handleLeave(isAnonymous)}
            className="hover:bg-accent shrink-0 rounded-lg p-2 transition-colors duration-200"
            aria-label="Go back to chat list"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-3">
            {displayImage && (
              <div className="relative shrink-0">
                <Image
                  src={displayImage}
                  alt={displayName}
                  width={48}
                  height={48}
                  className="ring-border h-12 w-12 rounded-full object-cover ring-2"
                />
                {isPrivate && (
                  <div
                    className={`ring-background absolute right-0 bottom-0 h-3 w-3 rounded-full ${isOnline ? "bg-green-500 ring-2 dark:bg-green-400" : "bg-gray-400 ring-2 dark:bg-gray-600"}`}
                  />
                )}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-semibold">{displayName}</h1>
              {isPrivate && isAvailable ? (
                <p className="text-muted-foreground text-xs">
                  {otherUser?.status === "online" ? "Online" : "Offline"}
                </p>
              ) : (
                <p className="text-muted-foreground text-xs">
                  {room.members.length}{" "}
                  {room.members.length === 1 ? "member" : "members"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right section - Sidebar trigger */}
        <div className="shrink-0 pr-2">
          <SidebarTrigger hideLabel={true} />
        </div>
      </div>
    </div>
  );
}

export default RoomHeader;
