"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import Image from "next/image";
import LogoutModal from "./modals/logout-modal";
import { useRouter } from "next/navigation";
import { UserLinkedAccount } from "@/types/user";
import { Loader2 } from "lucide-react";
import NotificationBell from "./notification-request";
import { useGetRoomInvites } from "@/hooks/use-room-invite";
import { useMemo } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import useHybridSession from "@/hooks/use-hybrid-session";

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
    anonAlias: string;
    anonAvatar: string;
    preferences: {
      theme: "light" | "dark";
      hideTypingIndicator: boolean;
      hideStatus: boolean;
    };
    linkedAccounts: UserLinkedAccount[];
    sessionId: string;
    role: "user" | "anonymous" | "admin";
    sessionRevoked: boolean;
  };
}

function ChatHeader({ session: serverSession }: { session: Session }) {
  const { session } = useHybridSession(serverSession);
  const isMobile = useIsMobile();
  const router = useRouter();

  const isAnonymous = useMemo(() => {
    return session.user.role === "anonymous" || session.user.isAnonymous;
  }, [session.user]);

  const {
    data: messageRequests,
    isLoading: isMessageRequestsLoading,
    isFetching: isMessageRequestsFetching,
  } = useGetRoomInvites(session.user.id, !isAnonymous);

  const isRequestsLoading = useMemo(() => {
    return isMessageRequestsLoading || isMessageRequestsFetching;
  }, [isMessageRequestsLoading, isMessageRequestsFetching]);

  const userAvatar = useMemo(() => {
    if (session.user.isAnonymous) {
      return session.user.anonAvatar || "/default-avatar.png";
    }

    return session.user.image || "/default-avatar.png";
  }, [session.user]);

  const userName = useMemo(() => {
    if (session.user.isAnonymous) {
      return session.user.anonAlias || "Anonymous";
    }

    return session.user.name || "User";
  }, [session.user]);

  if (!session) return null;

  return (
    <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
        {/* Logo Section */}
        <div className="flex min-w-0 shrink items-center gap-1.5 sm:gap-2">
          <SidebarTrigger className="flex w-fit cursor-pointer items-center gap-2" />
        </div>

        {/* Right Section */}
        {session && (
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 md:gap-3">
            {/* Message Requests Notification with Loading State */}
            {!isAnonymous && isRequestsLoading ? (
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full sm:h-9 sm:w-9">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600 sm:h-5 sm:w-5 dark:text-blue-400" />
              </div>
            ) : (
              !isAnonymous && (
                <NotificationBell requests={messageRequests || []} />
              )
            )}

            {/* User Profile Section */}
            <button
              className="flex items-center gap-1.5 rounded-full py-0.5 pr-2 pl-0.5 transition-colors hover:bg-gray-100 active:bg-gray-200 sm:gap-2 sm:py-1 sm:pr-3 sm:pl-1 dark:hover:bg-gray-800 dark:active:bg-gray-700"
              onClick={() => router.push("/chat/profile")}
              aria-label="View profile"
            >
              <div className="relative shrink-0">
                <Image
                  src={userAvatar}
                  alt="User Avatar"
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full border-2 border-white object-cover shadow-sm sm:h-9 sm:w-9 dark:border-gray-700"
                />
                {!session.user.preferences.hideStatus && (
                  <span
                    className={`absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-white sm:h-3 sm:w-3 dark:border-gray-900 ${
                      session.user.status === "online"
                        ? "bg-green-500 dark:bg-green-400"
                        : "bg-gray-400 dark:bg-gray-600"
                    }`}
                    aria-label={session.user.status}
                  />
                )}
              </div>

              {!isMobile && (
                <span className="hidden text-sm font-medium text-gray-900 md:inline-block dark:text-gray-100">
                  {userName.split(" ")[0]}
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
