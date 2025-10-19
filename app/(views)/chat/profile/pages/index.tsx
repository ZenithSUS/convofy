"use client";

import { Session } from "@/app/(views)/chat/components/chat-header";
import { ChevronRightIcon, Loader2 } from "lucide-react";
import Image from "next/image";
import { useGetUserDataStats } from "@/hooks/use-user";
import { useMemo } from "react";
import Link from "next/link";
import profileSettings from "@/constants/profile-settings";
import ProfileHeader from "../components/profile-header";

function ProfilePageClient({ session }: { session: Session }) {
  const {
    data: userStats,
    isLoading,
    isFetching,
  } = useGetUserDataStats(session.user.id);

  const isStatsProcessing = useMemo(
    () => isLoading || isFetching,
    [isLoading, isFetching],
  );

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Background */}
      <ProfileHeader userId={session.user.id} />

      {/* Profile Content */}
      <div className="relative px-4 pb-8">
        {/* User Avatar Card */}
        <div className="relative -mt-20 mb-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl backdrop-blur-lg">
            <div className="flex flex-col items-center gap-3">
              <div className="group relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-50 blur-md transition-opacity group-hover:opacity-75"></div>
                <Image
                  src={session.user.image || "/default-avatar.png"}
                  alt="User Avatar"
                  height={100}
                  width={100}
                  priority
                  className="relative h-24 w-24 rounded-full border-4 border-white object-cover shadow-lg"
                />
              </div>

              <div className="flex flex-col items-center gap-1 text-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  {session.user.name}
                </h1>
                <p className="text-sm text-gray-600">{session.user.email}</p>
                <div
                  className={`mt-2 rounded-full bg-green-100 px-3 py-1 text-xs font-medium ${session.user.status === "online" ? "text-green-800" : "text-gray-800"}`}
                >
                  {session.user.status === "online" ? "Online" : "Offline"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Settings */}
        <div className="space-y-3">
          <h2 className="mb-3 px-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
            Quick Actions
          </h2>

          {profileSettings.map((setting, index) => (
            <Link
              href={setting.href}
              key={setting.name}
              className="group block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:border-gray-300 hover:shadow-md"
              style={{
                animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
              }}
            >
              <div className="flex items-center gap-4 p-4">
                <div
                  className={`h-12 w-12 flex-shrink-0 rounded-xl bg-gradient-to-br ${setting.color} flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}
                >
                  {setting.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                    {setting.name}
                  </h3>
                  <p className="truncate text-sm text-gray-500">
                    {setting.description}
                  </p>
                </div>

                <ChevronRightIcon
                  size={20}
                  className="text-gray-400 transition-all duration-300 group-hover:translate-x-1 group-hover:text-blue-600"
                />
              </div>
            </Link>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center text-center">
              <div className="text-2xl font-bold text-gray-900">
                {isStatsProcessing ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  userStats?.messages
                )}
              </div>
              <div className="mt-1 text-xs text-gray-500">Messages</div>
            </div>
            <div className="flex flex-col items-center border-x border-gray-200 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {isStatsProcessing ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  userStats?.medias
                )}
              </div>
              <div className="mt-1 text-xs text-gray-500">Media</div>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="text-2xl font-bold text-gray-900">
                {isStatsProcessing ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  userStats?.contacts
                )}
              </div>
              <div className="mt-1 text-xs text-gray-500">Contacts</div>
            </div>
          </div>
        </div>
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
