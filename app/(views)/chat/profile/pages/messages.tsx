"use client";

import { Session } from "@/app/(views)/chat/components/chatpage/chat-header";
import ProfileHeader from "@/app/(views)/chat/profile/components/profile-header";
import { useGetMessagesByUserId } from "@/hooks/use-message";
import {
  ImageIcon,
  Loader2,
  MessageSquareIcon,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import UserMessageCard from "@/app/(views)/chat/profile/components/cards/user-message-card";
import LoadMoreButton from "@/app/(views)/chat/profile/components/load-more-button";
import { useGetUserMessageStats } from "@/hooks/use-user";
import { useQueryClient } from "@tanstack/react-query";
import SearchBar from "@/components/ui/searchbar";
import { motion } from "framer-motion";
import AvatarCard from "@/app/(views)/chat/profile/components/avatar-card";
import useHybridSession from "@/hooks/use-hybrid-session";

interface MessagesPageClientProps {
  serverSession: Session;
}

function MessagesPageClient({ serverSession }: MessagesPageClientProps) {
  const { session } = useHybridSession(serverSession);

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
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 dark:bg-linear-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header Background */}
      <ProfileHeader
        userId={session.user.id}
        sessionId={session.user.sessionId}
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-8">
        {/* User Avatar Card */}
        <AvatarCard session={session} name="Messages">
          {/* Message Stats */}
          <div className="mx-auto max-w-7xl pb-4">
            <div className="grid grid-cols-3 place-content-center gap-4">
              <div className="flex flex-col items-center rounded-3xl border border-green-300 bg-linear-to-br from-green-50 to-green-100 p-4 shadow-2xl backdrop-blur-lg dark:bg-linear-to-br dark:from-green-900 dark:to-green-800">
                <MessageSquareIcon className="h-7 w-7 text-green-900 dark:text-green-300" />
                <p className="flex items-center justify-center gap-2 text-2xl font-bold text-green-900 dark:text-green-300">
                  {isUserMessageStatsProcessing ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    userMessageStats?.messages || 0
                  )}
                </p>
                <p className="text-center text-sm text-green-700 dark:text-green-500">
                  Total
                </p>
              </div>
              <div className="flex flex-col items-center rounded-3xl border border-blue-300 bg-linear-to-br from-blue-50 to-blue-100 p-4 shadow-2xl backdrop-blur-lg dark:bg-linear-to-br dark:from-blue-900 dark:to-blue-800">
                <Sparkles className="h-7 w-7 text-blue-900 dark:text-blue-300" />
                <p className="flex items-center justify-center gap-2 text-2xl font-bold text-blue-900 dark:text-blue-300">
                  {isUserMessageStatsProcessing ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    userMessageStats?.editedMessages || 0
                  )}
                </p>
                <p className="text-center text-sm text-blue-700 dark:text-blue-500">
                  Edited
                </p>
              </div>
              <div className="flex flex-col items-center rounded-3xl border border-gray-300 bg-linear-to-br from-gray-50 to-gray-100 p-4 shadow-2xl backdrop-blur-lg dark:bg-linear-to-br dark:from-gray-900 dark:to-gray-800">
                <ImageIcon className="h-7 w-7 text-gray-900 dark:text-gray-300" />
                <p className="flex items-center justify-center gap-2 text-2xl font-bold text-gray-900 dark:text-gray-300">
                  {isUserMessageStatsProcessing ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    userMessageStats?.nonTextMessages || 0
                  )}
                </p>
                <p className="text-center text-sm text-gray-700 dark:text-gray-400">
                  Non-Text
                </p>
              </div>
            </div>
          </div>
        </AvatarCard>

        {/* Message Search */}
        <div className="relative mb-4">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search messages"
            className="rounded-xl border-2 border-gray-200 bg-white shadow-sm transition-all duration-300 focus-within:border-blue-500 hover:border-blue-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500"
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

        {/* Search Result */}
        {isSearchMode && (
          <div className="pb-4">
            <div className="rounded-xl border border-blue-100 bg-linear-to-r from-blue-50 to-purple-50 p-4 dark:bg-linear-to-r dark:from-blue-900 dark:to-purple-900">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    <TrendingUp
                      size={16}
                      className="text-blue-600 dark:text-blue-400"
                    />
                    Search Results
                  </h2>
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    Found{" "}
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {userMessagesData ? userMessagesData.length : 0}
                    </span>{" "}
                    matches for {`"${debouncedSearchQuery}"`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto">
          {/* Messages Content */}
          {isMessagesProcessing && (
            <div className="flex items-center justify-center p-4 text-gray-500 dark:text-gray-400">
              <Loader2 className="mr-2 animate-spin" />
              Loading messages...
            </div>
          )}

          {userMessagesData?.length === 0 && !isMessagesProcessing && (
            <div className="flex items-center justify-center p-4 text-gray-500 dark:text-gray-400">
              No messages found
            </div>
          )}

          {userMessagesData?.map((userMessages, index) => (
            <motion.div
              key={userMessages._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2, delay: index * 0.1 }}
            >
              <UserMessageCard key={userMessages._id} message={userMessages} />
            </motion.div>
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
