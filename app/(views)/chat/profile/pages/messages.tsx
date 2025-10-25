"use client";

import { Session } from "@/app/(views)/chat/components/chat-header";
import ProfileHeader from "@/app/(views)/chat/profile/components/profile-header";
import UserImage from "@/app/(views)/chat/profile/components/user-image";
import { useGetMessagesByUserId } from "@/hooks/use-message";
import { Loader2, MessageSquareIcon, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import UserMessageCard from "@/app/(views)/chat/profile/components/cards/user-message-card";
import LoadMoreButton from "@/app/(views)/chat/profile/components/load-more-button";
import { useGetUserMessageStats } from "@/hooks/use-user";
import { useQueryClient } from "@tanstack/react-query";
import SearchBar from "@/components/ui/searchbar";

interface MessagesPageClientProps {
  session: Session;
}

function MessagesPageClient({ session }: MessagesPageClientProps) {
  const DEBOUNCE_MS = 500;
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  const isSearchMode = useMemo<boolean>(() => {
    return debouncedSearchQuery.trim().length > 0;
  }, [debouncedSearchQuery]);

  const {
    data: userMessages,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useGetMessagesByUserId(
    session.user.id,
    5,
    isSearchMode,
    debouncedSearchQuery,
  );

  const {
    data: userMessageStats,
    isLoading: isUserMessageStatsLoading,
    isFetching: isUserMessageStatsFetching,
  } = useGetUserMessageStats(session.user.id);

  const userMessagesData = useMemo(
    () => userMessages?.pages.flat(),
    [userMessages],
  );

  const isMessagesProcessing = useMemo(
    () => isLoading || isFetching || isFetchingNextPage,
    [isLoading, isFetching, isFetchingNextPage],
  );

  const isUserMessageStatsProcessing = useMemo(
    () => isUserMessageStatsLoading || isUserMessageStatsFetching,
    [isUserMessageStatsLoading, isUserMessageStatsFetching],
  );

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, DEBOUNCE_MS);

    return () => clearTimeout(delay);
  }, [searchQuery]);

  // Remove Queries on unmount
  useEffect(() => {
    return () => {
      queryClient.removeQueries({ queryKey: ["messages", session.user.id] });
      queryClient.removeQueries({ queryKey: ["userMessageStats"] });
    };
  }, [session.user.id, queryClient]);

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header Background */}
      <ProfileHeader userId={session.user.id} />

      <div className="relative mx-auto max-w-7xl px-4 pb-8">
        {/* User Avatar Card */}
        <div className="relative -mt-20 mb-8">
          <div className="rounded-3xl border border-gray-300 bg-white p-6 shadow-2xl backdrop-blur-lg">
            <div className="flex flex-col items-center gap-3">
              <UserImage userImage={session.user.image} />
              <div className="text-center">
                <h1 className="mb-2 text-3xl font-bold text-gray-900">
                  Messages
                </h1>
                <p className="text-sm text-gray-600">{session.user.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Message Stats */}
        <div className="mx-auto max-w-7xl pb-4">
          <div className="grid grid-cols-3 place-content-center gap-4">
            <div className="rounded-3xl border border-gray-300 bg-white p-4 shadow-2xl backdrop-blur-lg">
              <p className="flex items-center justify-center gap-2 text-2xl font-bold text-gray-900">
                {isUserMessageStatsProcessing ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  userMessageStats?.messages || 0
                )}
              </p>
              <p className="text-center text-sm text-gray-600">Total</p>
            </div>
            <div className="rounded-3xl border border-gray-300 bg-white p-4 shadow-2xl backdrop-blur-lg">
              <p className="flex items-center justify-center gap-2 text-2xl font-bold text-gray-900">
                {isUserMessageStatsProcessing ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  userMessageStats?.editedMessages || 0
                )}
              </p>
              <p className="text-center text-sm text-gray-600">Edited</p>
            </div>
            <div className="rounded-3xl border border-gray-300 bg-white p-4 shadow-2xl backdrop-blur-lg">
              <p className="flex items-center justify-center gap-2 text-2xl font-bold text-gray-900">
                {isUserMessageStatsProcessing ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  userMessageStats?.nonTextMessages || 0
                )}
              </p>
              <p className="text-center text-sm text-gray-600">Non-Text</p>
            </div>
          </div>
        </div>

        {/* Message Search */}
        <div className="relative mb-4">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search messages"
            className="rounded-xl border-2 border-gray-200 bg-white shadow-sm transition-all duration-300 focus-within:border-blue-500 hover:border-blue-300"
          />
          {searchQuery && (
            <div className="absolute top-1/2 right-3 -translate-y-1/2">
              <Sparkles size={16} className="animate-pulse text-blue-500" />
            </div>
          )}
        </div>

        <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto">
          {/* Messages Content */}
          {isMessagesProcessing && (
            <div className="flex items-center justify-center p-4 text-gray-500">
              <Loader2 className="mr-2 animate-spin" />
              Loading messages...
            </div>
          )}

          {userMessagesData?.length === 0 && !isMessagesProcessing && (
            <div className="flex items-center justify-center p-4 text-gray-500">
              No messages found
            </div>
          )}

          {userMessagesData?.map((userMessages) => (
            <UserMessageCard key={userMessages._id} message={userMessages} />
          ))}
        </div>

        {/* Load More Button */}
        {hasNextPage && (
          <LoadMoreButton
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            icon={MessageSquareIcon}
            content="messages"
          />
        )}
      </div>
    </div>
  );
}

export default MessagesPageClient;
