"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import ProfileLogoutModal from "@/app/(views)/chat/profile/components/modals/profile-logout-modal";

function ProfileHeader() {
  const router = useRouter();

  return (
    <div className="relative h-40 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
      <div className="absolute inset-0 bg-black/10"></div>

      {/* Back Button - Positioned in header */}
      <div className="absolute top-6 left-6 z-10">
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2.5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-white hover:shadow-xl"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700 transition-colors duration-300 group-hover:-translate-x-1 group-hover:text-blue-600" />
          <span className="font-semibold text-gray-700 transition-colors group-hover:text-blue-600">
            Back
          </span>
        </button>
      </div>

      {/* Logout Button - Positioned in header */}
      <div className="absolute top-6 right-6 z-10">
        <ProfileLogoutModal />
      </div>
    </div>
  );
}

export default ProfileHeader;
