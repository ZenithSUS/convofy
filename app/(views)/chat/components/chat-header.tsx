"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import Image from "next/image";
import LogoutModal from "./modals/logout-modal";
import { useRouter } from "next/navigation";
import { UserLinkedAccount } from "@/types/user";
import { MessageSquare, Loader2 } from "lucide-react";

import NotificationBell from "./notification-request";
import { useGetRoomInvites } from "@/hooks/use-room-invite";
import { useMemo } from "react";

export interface Session {
  user: {
    id: string;
    image: string;
    name: string;
    email: string;
    avatar?: string;
    status: "online" | "offline";
    createdAt: Date;
    lastActive: Date;
    isAvailable: boolean;
    isAnonymous: boolean;
    linkedAccounts: UserLinkedAccount[];
    sessionId: string;
    role: "user" | "admin";
  };
}

function ChatHeader({ session }: { session: Session }) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const {
    data: messageRequests,
    isLoading: isMessageRequestsLoading,
    isFetching: isMessageRequestsFetching,
  } = useGetRoomInvites(session.user.id);

  const isRequestsLoading = useMemo(() => {
    return isMessageRequestsLoading || isMessageRequestsFetching;
  }, [isMessageRequestsLoading, isMessageRequestsFetching]);

  if (!session) return null;

  return (
    <div className="border-b bg-white">
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
        {/* Logo Section */}
        <div className="flex min-w-0 shrink items-center gap-1.5 sm:gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-purple-600 sm:h-10 sm:w-10">
            <MessageSquare className="h-4 w-4 text-white sm:h-5 sm:w-5" />
          </div>
          <h1 className="truncate bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-lg font-bold text-transparent sm:text-xl">
            Convofy
          </h1>
        </div>

        {/* Right Section */}
        {session && (
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 md:gap-3">
            {/* Message Requests Notification with Loading State */}
            {isRequestsLoading ? (
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full sm:h-9 sm:w-9">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600 sm:h-5 sm:w-5" />
              </div>
            ) : (
              <NotificationBell requests={messageRequests || []} />
            )}

            {/* User Profile Section */}
            <button
              className="flex items-center gap-1.5 rounded-full py-0.5 pr-2 pl-0.5 transition-colors hover:bg-gray-100 active:bg-gray-200 sm:gap-2 sm:py-1 sm:pr-3 sm:pl-1"
              onClick={() => router.push("/chat/profile")}
              aria-label="View profile"
            >
              <div className="relative shrink-0">
                <Image
                  src={session.user.image || "/default-avatar.png"}
                  alt="User Avatar"
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full border-2 border-white object-cover shadow-sm sm:h-9 sm:w-9"
                />
                <span
                  className={`absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-white sm:h-3 sm:w-3 ${
                    session.user.status === "online"
                      ? "bg-green-500"
                      : "bg-gray-400"
                  }`}
                  aria-label={session.user.status}
                />
              </div>

              {!isMobile && (
                <span className="hidden text-sm font-medium text-gray-900 md:inline-block">
                  {session.user.name || session.user.email}
                </span>
              )}
            </button>

            {/* Logout Button */}
            <div className="shrink-0">
              <LogoutModal
                userId={session.user.id}
                sessionId={session.user.sessionId}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatHeader;
