"use client";

import Loading from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import Image from "next/image";
import SearchBar from "@/components/ui/searchbar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useGetRooms } from "@/hooks/use-rooms";
import RoomCard from "@/components/ui/room-card";
import { Room } from "@/types/room";
import { useIsMobile } from "@/hooks/use-mobile";

function ChatListPage() {
  const DEBOUNCE_MS = 500;
  const { data: session } = useSession();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const { data: rooms, isLoading } = useGetRooms(debouncedSearchQuery);

  const isSearchMode = useMemo<boolean>(() => {
    return debouncedSearchQuery.trim().length > 0;
  }, [debouncedSearchQuery]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, DEBOUNCE_MS);

    return () => clearTimeout(delay);
  }, [searchQuery]);

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-2 border-b pb-2">
          <div>
            <h1 className="text-2xl font-bold">Convofy</h1>
          </div>

          {session && (
            <div className="flex items-center space-x-2">
              {session.user.image && (
                <Image
                  src={session.user.image || "/default-avatar.png"}
                  alt="User Avatar"
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full"
                />
              )}
              <div className="text-md text-black">
                {(isMobile
                  ? session.user.name?.split(" ")[0]
                  : session.user.name) || session.user.email}
              </div>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <SearchBar
          className="mb-4 border-2 border-gray-200"
          onSearch={handleSearch}
        />

        {isSearchMode && (
          <div className="mb-2 flex flex-col gap-0.5">
            <h2 className="text-lg font-semibold">
              Showing results for "{debouncedSearchQuery}"
            </h2>
            <p className="text-sm text-gray-600">
              {rooms && rooms.length > 0 ? rooms.length : 0} results
            </p>
          </div>
        )}

        {/* List of chat rooms would go here */}

        <div className="space-y-4">
          {rooms && rooms.length > 0 ? (
            rooms.map((room: Room) => <RoomCard key={room._id} room={room} />)
          ) : (
            <p className="text-center text-gray-500">
              No chat rooms available.
            </p>
          )}
        </div>
      </div>
      <div className="border-t p-4">
        <Button className="w-full">Create New Chat Room</Button>
      </div>
    </div>
  );
}

export default ChatListPage;
