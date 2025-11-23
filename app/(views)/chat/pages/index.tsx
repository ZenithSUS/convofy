"use client";

// React
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";

// Next
import { useRouter } from "next/navigation";

// Components
import { Button } from "@/components/ui/button";
import ConnectionStatus from "@/app/(views)/chat/[roomId]/components/room/connection-status";
import ChatHeader, {
  Session,
} from "@/app/(views)/chat/components/chatpage/chat-header";
import NormalContent from "@/app/(views)/chat/components/chatpage/normal-content";
import AnonymousContent from "@/app/(views)/chat/components/chatpage/anonymous-content";
import SearchRoomBar from "@/app/(views)/chat/components/chatpage/search-bar";
import SearchRoomResults from "@/app/(views)/chat/components/chatpage/search-results";
import MatchFound from "@/app/(views)/chat/components/chatpage/match-found";

// Hooks
import useConnectionStatus from "@/store/connection-status-store";
import useHybridSession from "@/hooks/use-hybrid-session";
import useAnonymousMatching from "@/hooks/use-anonymous-channel";
import { useGetRoomByUserId } from "@/hooks/use-rooms";
import { RoomContent } from "@/types/room";
import { toast } from "sonner";

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
  const [showPreferences, setShowPreferences] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [currentInterest, setCurrentInterest] = useState("");
  const [language, setLanguage] = useState("en");
  const { status: connectionStatus } = useConnectionStatus();

  const isAnonymous = useMemo<boolean>(() => {
    return (
      (session.user.isAnonymous || session.user.role === "anonymous") ?? false
    );
  }, [session]);

  const { isSearching, startSearching, cancelSearch, isMatched, isCancelling } =
    useAnonymousMatching(session.user.id, isAnonymous);

  const isSearchMode = useMemo<boolean>(() => {
    return debouncedSearchQuery.trim().length > 0;
  }, [debouncedSearchQuery]);

  const id = useMemo<string>(() => {
    return session.user.id;
  }, [session]);

  const isAvailable = useMemo<boolean>(() => {
    return session.user.isAvailable;
  }, [session]);

  const userTheme = useMemo<"light" | "dark">(() => {
    return session.user.preferences.theme;
  }, [session.user.preferences.theme]);

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
      toast.promise(
        async () => {
          await refetch();
        },
        {
          success: "Chats refreshed successfully",
          loading: "Refreshing chats...",
          error: "Failed to refresh chats",
        },
      );
    } catch (error) {
      toast.error("Failed to refresh chats");
      console.error("Refresh error:", error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [isRefreshing, isFetching, refetch]);

  const handleStartAnonymousChat = useCallback(() => {
    setShowPreferences(true);
  }, []);

  const handleStartSearching = useCallback(async () => {
    if (!language) {
      toast.error("Please select a language");
      return;
    }

    const preferences = {
      interests: interests.map((interest) => interest.trim()),
      language: language,
    };

    setShowPreferences(false);
    await startSearching(preferences);
  }, [interests, language, startSearching]);

  const handleStopSearching = useCallback(async () => {
    setShowPreferences(false);
    await cancelSearch();
  }, [cancelSearch]);

  const handleAddInterest = useCallback(() => {
    if (currentInterest.trim() && !interests.includes(currentInterest.trim())) {
      setInterests([...interests, currentInterest.trim()]);
      setCurrentInterest("");
    }
  }, [currentInterest, interests]);

  const handleRemoveInterest = useCallback(
    (interest: string) => {
      setInterests(interests.filter((i) => i !== interest));
    },
    [interests],
  );

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

          {/* Search Bar with Refresh Button - For Authenticated Users */}
          {!isAnonymous && isAvailable && (
            <SearchRoomBar
              searchQuery={searchQuery}
              isRefreshing={isRefreshing}
              isFetching={isFetching}
              handleSearch={handleSearch}
              handleRefresh={handleRefresh}
            />
          )}

          {/* Anonymous User Search Button */}
          {isAnonymous && !isSearching && !showPreferences && (
            <div className="hidden px-4 pb-4 md:block">
              <Button
                className="group h-12 w-full rounded-xl bg-linear-to-r from-blue-600 to-purple-600 font-semibold text-white shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600"
                onClick={handleStartAnonymousChat}
              >
                <Search
                  size={20}
                  className="mr-2 transition-transform duration-300 group-hover:scale-110"
                />
                Start Random Chat
              </Button>
            </div>
          )}

          {/* Search Results Header */}
          {!isAnonymous && isSearchMode && (
            <SearchRoomResults
              rooms={roomsList}
              debouncedSearchQuery={debouncedSearchQuery}
            />
          )}
        </div>

        {/* List of chat rooms - Authenticated Users */}
        {!isAnonymous && (
          <NormalContent
            session={session}
            userTheme={userTheme}
            isAnonymous={isAnonymous}
            roomsList={roomsList}
            isFetching={isFetching}
            isAvailable={isAvailable}
            isSearchMode={isSearchMode}
            roomError={roomError}
            roomErrorData={roomErrorData}
            refetch={refetch}
            debouncedSearchQuery={debouncedSearchQuery}
          />
        )}

        {/* Anonymous User Content */}
        {isAnonymous && !isMatched ? (
          <AnonymousContent
            isSearching={isSearching}
            isCancelling={isCancelling}
            language={language}
            setLanguage={setLanguage}
            currentInterest={currentInterest}
            interests={interests}
            showPreferences={showPreferences}
            setCurrentInterest={setCurrentInterest}
            setShowPreferences={setShowPreferences}
            handleRemoveInterest={handleRemoveInterest}
            handleAddInterest={handleAddInterest}
            handleStartSearching={handleStartSearching}
            handleStopSearching={handleStopSearching}
          />
        ) : (
          isMatched && <MatchFound theme={userTheme} />
        )}
      </div>

      {/* Floating Action Button - Authenticated Users */}
      {!isAnonymous && isAvailable ? (
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

      {/* Floating Action Button - Anonymous Users */}
      {isAnonymous && !showPreferences && (
        <div className="fixed right-0 bottom-0 left-0 border-t border-gray-200 bg-linear-to-t from-white via-white to-transparent p-4 md:hidden dark:border-gray-800 dark:from-gray-900 dark:via-gray-900">
          {isSearching ? (
            <Button
              variant="outline"
              className="group h-12 w-full rounded-xl border-2 border-red-500 font-semibold text-red-500 shadow-lg transition-all duration-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-950/20"
              disabled={isCancelling}
              onClick={handleStopSearching}
            >
              {isCancelling ? "Cancelling..." : " Cancel Search"}
            </Button>
          ) : (
            <Button
              className="group h-12 w-full rounded-xl bg-linear-to-r from-blue-600 to-purple-600 font-semibold text-white shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600"
              onClick={handleStartAnonymousChat}
            >
              <Search
                size={20}
                className="mr-2 transition-transform duration-300 group-hover:scale-110"
              />
              Start Random Chat
            </Button>
          )}
        </div>
      )}

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
