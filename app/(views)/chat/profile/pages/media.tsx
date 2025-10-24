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
import UserImage from "@/app/(views)/chat/profile/components/user-image";
import LoadMoreButton from "@/app/(views)/chat/profile/components/load-more-button";

interface MediaPageProps {
  session: Session;
}

function MediaPageClient({ session }: MediaPageProps) {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header Background */}
      <ProfileHeader userId={session.user.id} />

      <div className="relative mx-auto max-w-7xl px-4 pb-8">
        {/* Enhanced Profile Card */}
        <div className="relative -mt-20 mb-8">
          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-2xl backdrop-blur-lg">
            <div className="flex flex-col items-center gap-4">
              <UserImage userImage={session.user.image} />

              <div className="text-center">
                <h1 className="mb-2 text-3xl font-bold text-gray-900">
                  Media Gallery
                </h1>
                <p className="text-sm text-gray-600">{session.user.name}</p>
              </div>

              {/* Stats Cards */}
              <div className="mt-4 grid w-full grid-cols-3 gap-4">
                <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4 text-center">
                  <ImageIcon className="mx-auto mb-2 h-6 w-6 text-blue-600" />
                  <div className="text-2xl font-bold text-blue-900">
                    {mediaStats.images}
                  </div>
                  <div className="text-xs text-blue-700">Images</div>
                </div>
                <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-4 text-center">
                  <FileText className="mx-auto mb-2 h-6 w-6 text-purple-600" />
                  <div className="text-2xl font-bold text-purple-900">
                    {mediaStats.files}
                  </div>
                  <div className="text-xs text-purple-700">Files</div>
                </div>
                <div className="rounded-xl border border-pink-200 bg-gradient-to-br from-pink-50 to-pink-100 p-4 text-center">
                  <Download className="mx-auto mb-2 h-6 w-6 text-pink-600" />
                  <div className="text-2xl font-bold text-pink-900">
                    {mediaStats.total}
                  </div>
                  <div className="text-xs text-pink-700">Total</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid Controls */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">All Media</h2>
            <p className="text-sm text-gray-600">
              {isMediaProcessing ? "Loading..." : `${mediaData.length} items`}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setGridColumns(2)}
              className={`rounded-lg p-2 transition-all duration-200 ${
                gridColumns === 2
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              title="2 columns"
            >
              <Grid2x2 size={18} />
            </button>
            <button
              onClick={() => setGridColumns(3)}
              className={`rounded-lg p-2 transition-all duration-200 ${
                gridColumns === 3
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
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
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
              <ImageIcon
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform text-blue-600"
                size={24}
              />
            </div>
            <p className="mt-4 font-medium text-gray-600">
              Loading your media...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isMediaProcessing && mediaData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
              <ImageIcon size={40} className="text-gray-400" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-700">
              No media yet
            </h3>
            <p className="max-w-xs text-center text-sm text-gray-500">
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
            <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
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
