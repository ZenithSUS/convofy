"use client";

import ProfileLogoutModal from "@/app/(views)/chat/profile/components/modals/profile-logout-modal";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface ProfileHeaderProps {
  userId: string;
  sessionId: string;
  role: "user" | "anonymous" | "admin";
}

function ProfileHeader({ userId, sessionId, role }: ProfileHeaderProps) {
  return (
    <div className="relative h-40 overflow-hidden bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-900 dark:via-purple-900 dark:to-pink-900">
      {/* Animated background overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))] dark:bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.5),rgba(0,0,0,0))]"></div>
      <div className="absolute inset-0 bg-black/10 dark:bg-black/30"></div>

      {/* Decorative circles */}
      <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl dark:bg-white/5"></div>
      <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl dark:bg-white/5"></div>

      {/* Header Content */}
      <div className="relative z-10 flex h-full items-start justify-between p-6">
        {/* Sidebar Trigger - Blended with header */}
        <SidebarTrigger className="flex items-center gap-2" />

        {/* Logout Button - Positioned in header */}
        <ProfileLogoutModal userId={userId} sessionId={sessionId} role={role} />
      </div>
    </div>
  );
}

export default ProfileHeader;
