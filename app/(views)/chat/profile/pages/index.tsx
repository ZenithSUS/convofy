"use client";

import { Session } from "@/app/(views)/chat/components/chatpage/chat-header";
import { ChevronRightIcon, Loader2 } from "lucide-react";
import { useGetUserDataStats } from "@/hooks/use-user";
import { useMemo } from "react";
import Link from "next/link";
import profileSettings from "@/constants/profile-settings";
import ProfileHeader from "@/app/(views)/chat/profile/components/profile-header";
import UserImage from "@/app/(views)/chat/profile/components/user-image";
import useHybridSession from "@/hooks/use-hybrid-session";

function ProfilePageClient({ serverSession }: { serverSession: Session }) {
  const { session } = useHybridSession(serverSession);
  const {
    data: userStats,
    isLoading,
    isFetching,
  } = useGetUserDataStats(session.user.id);

  const userConnectionStatus = useMemo(() => {
    return session.user.status;
  }, [session]);

  const isStatsProcessing = useMemo(
    () => isLoading || isFetching,
    [isLoading, isFetching],
  );

  const userAvatar = useMemo(() => {
    if (session.user.isAnonymous && session.user.role === "user") {
      return session.user.anonAvatar || "/default-avatar.png";
    }

    if (session.user.isAnonymous && session.user.role === "anonymous") {
      return session.user.image || "/default-avatar.png";
    }

    return session.user.image || "/default-avatar.png";
  }, [session.user]);

  const userName = useMemo(() => {
    if (session.user.isAnonymous && session.user.role === "user") {
      return session.user.anonAlias || "Anonymous";
    }

    if (session.user.isAnonymous && session.user.role === "anonymous") {
      return session.user.name || "Anonymous";
    }

    return session.user.name || "User";
  }, [session.user]);

  if (!session) return null;

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header Background */}
      <ProfileHeader
        userId={session.user.id}
        sessionId={session.user.sessionId}
        role={session.user.role}
      />

      {/* Profile Content */}
      <div className="relative mx-auto max-w-7xl px-4 pb-8">
        {/* User Avatar Card */}
        <div className="relative -mt-20 mb-8">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl backdrop-blur-lg dark:border-gray-700 dark:bg-gray-800">
            <div className="flex flex-col items-center gap-3">
              <UserImage userImage={userAvatar} />
              <div className="flex flex-col items-center gap-1 text-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {userName}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {session.user.email}
                </p>
                {!session.user.preferences.hideStatus && (
                  <div
                    className={`mt-2 rounded-full px-3 py-1 text-xs font-medium ${userConnectionStatus === "online" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"}`}
                  >
                    {userConnectionStatus === "online" ? "Online" : "Offline"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Settings */}
        <div className="space-y-3">
          <h2 className="mb-3 px-2 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
            Quick Actions
          </h2>

          {profileSettings(session.user.role).map((setting, index) => (
            <Link
              href={setting.href}
              key={setting.name}
              className="group block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:border-gray-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
              style={{
                animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
              }}
            >
              <div className="flex items-center gap-4 p-4">
                <div
                  className={`h-12 w-12 shrink-0 rounded-xl bg-linear-to-br ${setting.color} flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}
                >
                  {setting.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 transition-colors group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400">
                    {setting.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {setting.description}
                  </p>
                </div>

                <ChevronRightIcon
                  size={20}
                  className="text-gray-400 transition-all duration-300 group-hover:translate-x-1 group-hover:text-blue-600 dark:text-gray-500 dark:group-hover:text-blue-400"
                />
              </div>
            </Link>
          ))}
        </div>

        {/* Stats Section */}
        {session.user.role === "user" && (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {isStatsProcessing ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    userStats?.messages
                  )}
                </div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Messages
                </div>
              </div>
              <div className="flex flex-col items-center border-x border-gray-200 text-center dark:border-gray-700">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {isStatsProcessing ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    userStats?.medias
                  )}
                </div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Media
                </div>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {isStatsProcessing ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    userStats?.contacts
                  )}
                </div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Contacts
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default ProfilePageClient;
