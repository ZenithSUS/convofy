"use client";

import { Session } from "@/app/(views)/chat/components/chat-header";
import { useGetMessagesByUserAndMedia } from "@/hooks/use-message";
import { MediaMessage } from "@/types/message";
import {
  Loader2,
  Image as ImageIcon,
  FileText,
  Download,
  Grid3x3,
  Grid2x2,
  FileIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import MediaCard from "@/app/(views)/chat/profile/components/cards/media-card";
import ProfileHeader from "@/app/(views)/chat/profile/components/profile-header";
import LoadMoreButton from "@/app/(views)/chat/profile/components/load-more-button";
import useHybridSession from "@/hooks/use-hybrid-session";
import AvatarCard from "../components/avatar-card";

interface MediaPageProps {
  serverSession: Session;
}

function MediaPageClient({ serverSession }: MediaPageProps) {
  const { session } = useHybridSession(serverSession);
  const [gridColumns, setGridColumns] = useState<2 | 3>(3);

  const {
    data: mediaMessages,
    isFetching,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useGetMessagesByUserAndMedia(session.user.id, 9);

  const isMediaProcessing = useMemo(
    () => isLoading || isFetching || isFetchingNextPage,
    [isLoading, isFetching, isFetchingNextPage],
  );

  const mediaData = useMemo<MediaMessage[]>(() => {
    if (!mediaMessages) return [];
    return mediaMessages.pages.flat();
  }, [mediaMessages]);

  const mediaStats = useMemo(() => {
    const images = mediaData.filter((m) => m.type === "image").length;
    const files = mediaData.filter((m) => m.type === "file").length;
    return { images, files, total: mediaData.length };
  }, [mediaData]);

  if (!session) return null;

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-950">
      {/* Header Background */}
      <ProfileHeader
        userId={session.user.id}
        sessionId={session.user.sessionId}
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-8">
        {/* Enhanced Profile Card */}

        <AvatarCard session={session} name="Media Gallery">
          {/* Stats Cards */}
          <div className="mt-4 grid w-full grid-cols-3 gap-4">
            <div className="rounded-xl border border-blue-200 bg-linear-to-br from-blue-50 to-blue-100 p-4 text-center dark:bg-linear-to-br dark:from-blue-950 dark:to-blue-900">
              <ImageIcon className="mx-auto mb-2 h-6 w-6 text-blue-600 dark:text-blue-400" />
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-400">
                {mediaStats.images}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-400">
                Images
              </div>
            </div>
            <div className="rounded-xl border border-purple-200 bg-linear-to-br from-purple-50 to-purple-100 p-4 text-center dark:bg-linear-to-br dark:from-purple-950 dark:to-purple-900">
              <FileText className="mx-auto mb-2 h-6 w-6 text-purple-600 dark:text-purple-400" />
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-400">
                {mediaStats.files}
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-400">
                Files
              </div>
            </div>
            <div className="rounded-xl border border-pink-200 bg-linear-to-br from-pink-50 to-pink-100 p-4 text-center dark:bg-linear-to-br dark:from-pink-950 dark:to-pink-900">
              <Download className="mx-auto mb-2 h-6 w-6 text-pink-600 dark:text-pink-400" />
              <div className="text-2xl font-bold text-pink-900 dark:text-pink-400">
                {mediaStats.total}
              </div>
              <div className="text-sm text-pink-700 dark:text-pink-400">
                Total
              </div>
            </div>
          </div>
        </AvatarCard>

        {/* Grid Controls */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              All Media
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isMediaProcessing ? "Loading..." : `${mediaData.length} items`}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <button
              onClick={() => setGridColumns(2)}
              className={`rounded-lg p-2 transition-all duration-200 ${
                gridColumns === 2
                  ? "bg-blue-500 text-white shadow-sm dark:bg-blue-600"
                  : "text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              title="2 columns"
            >
              <Grid2x2 size={18} />
            </button>
            <button
              onClick={() => setGridColumns(3)}
              className={`rounded-lg p-2 transition-all duration-200 ${
                gridColumns === 3
                  ? "bg-blue-500 text-white shadow-sm dark:bg-blue-600"
                  : "text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              title="3 columns"
            >
              <Grid3x3 size={18} />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isMediaProcessing && mediaData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 dark:border-blue-600"></div>
              <ImageIcon
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform text-blue-600 dark:text-blue-400"
                size={24}
              />
            </div>
            <p className="mt-4 font-medium text-gray-600 dark:text-gray-400">
              Loading your media...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isMediaProcessing && mediaData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-gray-100 to-gray-200 dark:bg-linear-to-br dark:from-gray-800 dark:to-gray-900">
              <ImageIcon
                size={40}
                className="text-gray-400 dark:text-gray-500"
              />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-700 dark:text-gray-100">
              No media yet
            </h3>
            <p className="max-w-xs text-center text-sm text-gray-500 dark:text-gray-400">
              Images and files you share in conversations will appear here
            </p>
          </div>
        )}

        {/* Media Grid */}
        {mediaData.length > 0 && (
          <div
            className={`grid gap-4 ${
              gridColumns === 2 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3"
            }`}
          >
            {mediaData.map((media: MediaMessage, index: number) => (
              <div
                key={media._id}
                className="group"
                style={{
                  animation: `fadeInUp 0.5s ease-out ${index * 0.05}s both`,
                }}
              >
                <MediaCard media={media} />
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {hasNextPage && (
          <LoadMoreButton
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            icon={FileIcon}
            content="Media"
          />
        )}

        {/* Loading Indicator for Pagination */}
        {isFetchingNextPage && (
          <div className="mt-4 flex items-center justify-center">
            <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 dark:border-blue-600 dark:bg-blue-900">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                Loading more items...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced CSS Animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}

export default MediaPageClient;
