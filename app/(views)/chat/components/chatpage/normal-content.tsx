import { AxiosErrorMessage } from "@/types/error";
import { RoomContent } from "@/types/room";
import { LockIcon, MessageSquare, Plus } from "lucide-react";
import UserCard from "@/app/(views)/chat/components/cards/user-card";
import RoomCard from "@/app/(views)/chat/components/cards/room-card";
import ErrorMessage from "@/components/ui/error-message";
import Loading from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Session } from "@/app/(views)/chat/components/chatpage/chat-header";
import { AxiosError } from "axios/";

interface NormalContentProps {
  session: Session;
  userTheme: "light" | "dark";
  isAnonymous: boolean;
  roomsList: RoomContent[];
  isFetching: boolean;
  isAvailable: boolean;
  isSearchMode: boolean;
  roomError: boolean;
  roomErrorData: AxiosErrorMessage | null;
  refetch: () => void;
  debouncedSearchQuery: string;
}

function NormalContent({
  session,
  userTheme,
  isAnonymous,
  roomsList,
  isFetching,
  isAvailable,
  isSearchMode,
  roomError,
  roomErrorData,
  refetch,
  debouncedSearchQuery,
}: NormalContentProps) {
  const router = useRouter();

  return (
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
          <ErrorMessage error={roomErrorData as AxiosError} onClick={refetch} />
        </div>
      ) : isFetching ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loading text="Getting your conversations" theme={userTheme} />
        </div>
      ) : !isAvailable ? (
        <div className="flex flex-col items-center justify-center py-30">
          <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-blue-100 to-purple-100 dark:from-blue-950/50 dark:to-purple-950/50">
            <LockIcon size={40} className="text-blue-500 dark:text-blue-400" />
          </div>

          <h3 className="dark:text-gray-200">Chat is currently unavailable</h3>
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
  );
}

export default NormalContent;
