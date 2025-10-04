"use client";

import { Button } from "@/components/ui/button";
import SearchBar from "@/components/ui/searchbar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useGetRooms } from "@/hooks/use-rooms";
import RoomCard from "@/app/(views)/chat/components/room-card";
import { Room } from "@/types/room";
import ChatHeader, { Session } from "@/app/(views)/chat/components/chat-header";
import { useRouter } from "next/navigation";

interface ChatListClientProps {
  session: Session;
}

function ChatListClient({ session }: ChatListClientProps) {
  const DEBOUNCE_MS = 500;
  const router = useRouter();

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

  return (
    <div className="flex h-screen flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {/* Header */}
        <ChatHeader session={session} />
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
        {/* List of chat rooms */}
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
        <Button
          className="w-full"
          onClick={() => router.replace("/chat/create")}
        >
          Create New Chat Room
        </Button>
      </div>
    </div>
  );
}

export default ChatListClient;
