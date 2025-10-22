"use client";

import { Button } from "@/components/ui/button";
import SearchBar from "@/components/ui/searchbar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useGetRoomByUserId } from "@/hooks/use-rooms";
import RoomCard from "@/app/(views)/chat/components/cards/room-card";
import { RoomContent } from "@/types/room";
import ChatHeader, { Session } from "@/app/(views)/chat/components/chat-header";
import { useRouter } from "next/navigation";
import Loading from "@/components/ui/loading";
import ErrorMessage from "@/components/ui/error-message";
import { AxiosError } from "axios/";
import { Plus, MessageSquare, Sparkles, TrendingUp } from "lucide-react";
import UserCard from "../components/cards/user-card";
import ConnectionStatus from "@/app/(views)/chat/[roomId]/components/connection-status";
import useUserConnectionStatus from "@/hooks/use-presence";

interface ChatListClientProps {
  session: Session;
}

function ChatListClient({ session }: ChatListClientProps) {
  const DEBOUNCE_MS = 500;
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const { connectionStatus } = useUserConnectionStatus({ session });

  const isSearchMode = useMemo<boolean>(() => {
    return debouncedSearchQuery.trim().length > 0;
  }, [debouncedSearchQuery]);

  const {
    data: rooms,
    isLoading,
    isFetching: isFetchingRooms,
    isError: roomError,
    error: roomErrorData,
    refetch,
  } = useGetRoomByUserId(session.user.id, isSearchMode, debouncedSearchQuery);

  const roomsList = useMemo<RoomContent[]>(() => {
    if (!rooms) return [];

    return rooms.sort((a, b) => {
      const aLastMessage = new Date(a.lastMessage?.createdAt || 0);
      const bLastMessage = new Date(b.lastMessage?.createdAt || 0);

      return bLastMessage.getTime() - aLastMessage.getTime();
    });
  }, [rooms]);

  const isFetching = useMemo<boolean>(() => {
    return isLoading || isFetchingRooms;
  }, [isLoading, isFetchingRooms]);

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
    <div className="flex h-screen flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 shadow-sm backdrop-blur-md">
          {/* Connection Status */}
          {connectionStatus !== "connected" && (
            <ConnectionStatus connectionStatus={connectionStatus} />
          )}

          {/* Header */}
          <div className="p-4 pb-3">
            <ChatHeader session={session} />
          </div>

          {/* Search Bar */}
          <div className="px-4 pb-4">
            <div className="relative">
              <SearchBar
                className="rounded-xl border-2 border-gray-200 bg-white shadow-sm transition-all duration-300 focus-within:border-blue-500 hover:border-blue-300"
                onSearch={handleSearch}
              />
              {searchQuery && (
                <div className="absolute top-1/2 right-3 -translate-y-1/2">
                  <Sparkles size={16} className="animate-pulse text-blue-500" />
                </div>
              )}
            </div>
          </div>

          {/* Search Results Header */}
          {isSearchMode && (
            <div className="px-4 pb-4">
              <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <TrendingUp size={16} className="text-blue-600" />
                      Search Results
                    </h2>
                    <p className="mt-1 text-xs text-gray-600">
                      Found{" "}
                      <span className="font-bold text-blue-600">
                        {rooms && rooms.length > 0 ? rooms.length : 0}
                      </span>{" "}
                      matches for {`"${debouncedSearchQuery}"`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* List of chat rooms */}
        <div className="space-y-3 p-4">
          {roomsList.length > 0 ? (
            <>
              {!isSearchMode && (
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <MessageSquare size={16} className="text-gray-600" />
                    Recent Conversations
                  </h3>
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
                    {roomsList.length} active
                  </span>
                </div>
              )}
              <div className="space-y-2">
                {roomsList.map((item: RoomContent, index: number) => (
                  <div
                    key={item._id}
                    style={{
                      animation: `slideInRight 0.4s ease-out ${index * 0.05}s both`,
                    }}
                  >
                    {item.type === "user" ? (
                      <UserCard
                        key={item._id}
                        user={item}
                        userId={session.user.id}
                      />
                    ) : (
                      <RoomCard
                        key={item._id}
                        room={item}
                        currentUserId={session.user.id}
                      />
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : roomError ? (
            <div className="mt-8">
              <ErrorMessage
                error={roomErrorData as AxiosError}
                onClick={refetch}
              />
            </div>
          ) : isFetching ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loading />
              <p className="mt-4 text-sm text-gray-500">
                Loading your chats...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-purple-100">
                <MessageSquare size={40} className="text-blue-500" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-700">
                {isSearchMode ? "No results found" : "No conversations yet"}
              </h3>
              <p className="mb-6 max-w-xs text-center text-sm text-gray-500">
                {isSearchMode
                  ? `No chats match "${debouncedSearchQuery}". Try a different search term.`
                  : "Start a new conversation to connect with others"}
              </p>
              {!isSearchMode && (
                <Button
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl"
                  onClick={() => router.replace("/chat/create")}
                >
                  <Plus size={18} className="mr-2" />
                  Create Your First Chat
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="sticky bottom-0 border-t border-gray-200 bg-gradient-to-t from-white via-white to-transparent p-4">
        <Button
          className="group h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 font-semibold text-white shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl"
          onClick={() => router.replace("/chat/create")}
        >
          <Plus
            size={20}
            className="mr-2 transition-transform duration-300 group-hover:rotate-90"
          />
          Create New Chat Room
        </Button>
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

export default ChatListClient;
