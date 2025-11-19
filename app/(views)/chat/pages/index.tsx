"use client";

// React
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  MessageSquare,
  Sparkles,
  TrendingUp,
  LockIcon,
  RefreshCw,
} from "lucide-react";
import { AxiosError } from "axios/";

// Next
import { useRouter } from "next/navigation";

// Components
import { Button } from "@/components/ui/button";
import SearchBar from "@/components/ui/searchbar";
import UserCard from "@/app/(views)/chat/components/cards/user-card";
import RoomCard from "@/app/(views)/chat/components/cards/room-card";
import ConnectionStatus from "@/app/(views)/chat/[roomId]/components/connection-status";
import ChatHeader, { Session } from "@/app/(views)/chat/components/chat-header";
import Loading from "@/components/ui/loading";
import ErrorMessage from "@/components/ui/error-message";
import { Toast } from "@/components/providers/toast-provider";

// Hooks
import { useGetRoomByUserId } from "@/hooks/use-rooms";
import { RoomContent } from "@/types/room";
import useConnectionStatus from "@/store/connection-status-store";
import useHybridSession from "@/hooks/use-hybrid-session";

interface ChatListClientProps {
  serverSession: Session;
}

function ChatListClient({ serverSession }: ChatListClientProps) {
  const DEBOUNCE_MS = 500;
  const router = useRouter();

  const { session } = useHybridSession(serverSession);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { status: connectionStatus } = useConnectionStatus();

  const isSearchMode = useMemo<boolean>(() => {
    return debouncedSearchQuery.trim().length > 0;
  }, [debouncedSearchQuery]);

  const isAnonymous = useMemo<boolean>(() => {
    return (
      (session.user.isAnonymous || session.user.role === "anonymous") ?? false
    );
  }, [session]);

  const id = useMemo<string>(() => {
    return session.user.id;
  }, [session]);

  const isAvailable = useMemo<boolean>(() => {
    return session.user.isAvailable;
  }, [session]);

  const {
    data: rooms,
    isLoading,
    isFetching: isFetchingRooms,
    isError: roomError,
    error: roomErrorData,
    refetch,
  } = useGetRoomByUserId(
    id,
    isAvailable,
    isSearchMode,
    !isAnonymous,
    debouncedSearchQuery,
  );

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

  const handleRefresh = useCallback(async () => {
    if (isRefreshing || isFetching) return;

    setIsRefreshing(true);
    try {
      await refetch();
      Toast.success("Chats refreshed successfully");
    } catch (error) {
      Toast.error("Failed to refresh chats");
      console.error("Refresh error:", error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [isRefreshing, isFetching, refetch]);

  useEffect(() => {
    const delay = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, DEBOUNCE_MS);

    return () => clearTimeout(delay);
  }, [searchQuery]);

  return (
    <div className="relative flex h-screen flex-col bg-linear-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 shadow-sm backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/80">
          {/* Connection Status */}
          {connectionStatus !== "connected" && (
            <ConnectionStatus connectionStatus={connectionStatus} />
          )}

          {/* Header */}
          <div className="p-4 pb-3">
            <ChatHeader session={session} />
          </div>

          {/* Search Bar with Refresh Button */}
          {!isAnonymous && isAvailable && (
            <div className="px-4 pb-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <SearchBar
                    className="rounded-xl border-2 border-gray-200 bg-white shadow-sm transition-all duration-300 focus-within:border-blue-500 hover:border-blue-300 dark:border-gray-700 dark:bg-gray-800 dark:focus-within:border-blue-400 dark:hover:border-blue-500"
                    onSearch={handleSearch}
                  />
                  {searchQuery && (
                    <div className="absolute top-1/2 right-3 -translate-y-1/2">
                      <Sparkles
                        size={16}
                        className="animate-pulse text-blue-500 dark:text-blue-400"
                      />
                    </div>
                  )}
                </div>

                {/* Refresh Button */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isRefreshing || isFetching}
                  className="h-10 w-10 shrink-0 rounded-xl border-2 border-gray-200 bg-white shadow-sm transition-all duration-300 hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500 dark:hover:bg-gray-700"
                  aria-label="Refresh chats"
                >
                  <RefreshCw
                    size={18}
                    className={`text-gray-600 transition-all duration-500 dark:text-gray-400 ${
                      isRefreshing || isFetching
                        ? "animate-spin text-blue-600 dark:text-blue-400"
                        : ""
                    }`}
                  />
                </Button>
              </div>
            </div>
          )}

          {/* Search Results Header */}
          {!isAnonymous && isSearchMode && (
            <div className="px-4 pb-4">
              <div className="rounded-xl border border-blue-100 bg-linear-to-r from-blue-50 to-purple-50 p-4 dark:border-blue-900/50 dark:from-blue-950/50 dark:to-purple-950/50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      <TrendingUp
                        size={16}
                        className="text-blue-600 dark:text-blue-400"
                      />
                      Search Results
                    </h2>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      Found{" "}
                      <span className="font-bold text-blue-600 dark:text-blue-400">
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
        <div className="space-y-3 p-4 pb-24 md:pb-4">
          {!isAnonymous && isAvailable && roomsList.length > 0 ? (
            <>
              {!isSearchMode && (
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <MessageSquare
                      size={16}
                      className="text-gray-600 dark:text-gray-400"
                    />
                    Recent Conversations
                  </h3>
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
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
                        isSearchMode={isSearchMode}
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
              <Loading text="Getting your conversations" />
            </div>
          ) : !isAvailable ? (
            <div className="flex flex-col items-center justify-center py-30">
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-blue-100 to-purple-100 dark:from-blue-950/50 dark:to-purple-950/50">
                <LockIcon
                  size={40}
                  className="text-blue-500 dark:text-blue-400"
                />
              </div>

              <h3 className="dark:text-gray-200">
                Chat is currently unavailable
              </h3>
              <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                You deactivated your account. Please reactivate to able to chat.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-blue-100 to-purple-100 dark:from-blue-950/50 dark:to-purple-950/50">
                <MessageSquare
                  size={40}
                  className="text-blue-500 dark:text-blue-400"
                />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-300">
                {isSearchMode ? "No results found" : "No conversations yet"}
              </h3>
              <p className="mb-6 max-w-xs text-center text-sm text-gray-500 dark:text-gray-400">
                {isSearchMode
                  ? `No chats match "${debouncedSearchQuery}". Try a different search term.`
                  : "Start a new conversation to connect with others"}
              </p>
              {!isSearchMode && (
                <Button
                  className="bg-linear-to-r from-blue-600 to-purple-600 text-white shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600"
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
      {isAvailable ? (
        <div className="fixed right-0 bottom-0 left-0 border-t border-gray-200 bg-linear-to-t from-white via-white to-transparent p-4 md:hidden dark:border-gray-800 dark:from-gray-900 dark:via-gray-900">
          <Button
            className="group h-12 w-full rounded-xl bg-linear-to-r from-blue-600 to-purple-600 font-semibold text-white shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600"
            onClick={() => router.replace("/chat/create")}
          >
            <Plus
              size={20}
              className="mr-2 transition-transform duration-300 group-hover:rotate-90"
            />
            Create New Chat Room
          </Button>
        </div>
      ) : null}

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
