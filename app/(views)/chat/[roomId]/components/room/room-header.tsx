"use client";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useLeaveAnonymousRoom } from "@/hooks/use-rooms";
import { RoomContent } from "@/types/room";
import { ArrowLeft, SearchIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";

interface RoomHeaderProps {
  room: RoomContent;
  userId: string;
  isAnonymous: boolean;
  startSearching: () => Promise<void>;
  isSearching: boolean;
  isMatched: boolean;
}

function RoomHeader({
  room,
  userId,
  isAnonymous,
  startSearching,
  isSearching,
  isMatched,
}: RoomHeaderProps) {
  const router = useRouter();
  const { mutateAsync: leaveRoom, isPending: isLeaving } =
    useLeaveAnonymousRoom();

  const isPrivate = useMemo<boolean>(() => {
    return room.isPrivate || (room.members.length === 2 && !room.name);
  }, [room]);

  const otherUser = useMemo(
    () => (isPrivate ? room.members.find((m) => m._id !== userId) : null),
    [room, userId, isPrivate],
  );

  const hideOnlineStatus = useMemo(() => {
    return otherUser?.preferences?.hideStatus;
  }, [otherUser]);

  const displayName = useMemo(() => {
    if (isPrivate && otherUser?.isAnonymous && otherUser.role === "user") {
      return room.isAnonymous
        ? otherUser.anonAlias || "Anonymous User"
        : otherUser?.name || "Anonymous User";
    }

    if (isPrivate && otherUser?.isAnonymous && otherUser.role === "anonymous") {
      return otherUser?.name || "Anonymous User";
    }

    if (isPrivate && !otherUser?.isAnonymous) {
      return otherUser?.name || "Unknown User";
    }

    return room.name || "Unknown Room";
  }, [room, otherUser, isPrivate]);

  const isAvailable = useMemo(() => {
    return isPrivate ? otherUser?.isAvailable || false : false;
  }, [otherUser, isPrivate]);

  const isMember = useMemo(() => {
    return room.members.some((m) => m._id === userId);
  }, [room, userId]);

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

  const handleLeave = useCallback(
    async (isAnonymous: boolean) => {
      try {
        if (isAnonymous) {
          toast.promise(
            async () => {
              await leaveRoom(room._id);
            },
            {
              loading: "Leaving room...",
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
    [router, room._id, leaveRoom],
  );

  const handleSearchNewUser = useCallback(async () => {
    try {
      if (isSearching) return;

      if (isMember) {
        toast.promise(
          async () => {
            await leaveRoom(room._id);
          },
          {
            loading: "Leaving room...",
            success: "Room left successfully",
            error: "Failed to leave room",
          },
        );
      }
      await startSearching();
    } catch (error) {
      console.error("[LEAVE ROOM ERROR]", error);
      toast.error("Failed to search new user");
    }
  }, [startSearching, room._id, leaveRoom, isMember, isSearching]);

  if (!room) return null;

  return (
    <div className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-10 backdrop-blur">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        {/* Left section - Back button and Room info */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Button
            variant="ghost"
            disabled={isLeaving || isSearching || isMatched}
            onClick={() => handleLeave(isAnonymous)}
            className="hover:bg-accent dark:hover:bg-accent/50 shrink-0 rounded-lg p-2 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Go back to chat list"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

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
                {isPrivate && !hideOnlineStatus && (
                  <div
                    className={`ring-background absolute right-0 bottom-0 h-3 w-3 rounded-full ${isOnline ? "bg-green-500 ring-2 dark:bg-green-400" : "bg-gray-400 ring-2 dark:bg-gray-600"}`}
                  />
                )}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-semibold">{displayName}</h1>
              {isPrivate && isAvailable && !hideOnlineStatus ? (
                <p className="text-muted-foreground text-xs">
                  {otherUser?.status === "online" ? "Online" : "Offline"}
                </p>
              ) : !isPrivate ? (
                <p className="text-muted-foreground text-xs">
                  {room.members.length}{" "}
                  {room.members.length === 1 ? "member" : "members"}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5">
          {isAnonymous && (
            <Button
              variant="ghost"
              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-purple-600 transition-all hover:from-blue-600 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50 dark:from-blue-600 dark:to-purple-700 dark:hover:from-blue-500 dark:hover:to-purple-600"
              aria-label="Search new user"
              disabled={isSearching || isLeaving || isMatched}
              onClick={handleSearchNewUser}
            >
              <SearchIcon className="cursor-pointer text-white" />
            </Button>
          )}

          {/* Right section - Sidebar trigger */}
          <div className="shrink-0 pr-2">
            <SidebarTrigger
              hideLabel={true}
              disabled={isLeaving || isSearching || isMatched}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoomHeader;
