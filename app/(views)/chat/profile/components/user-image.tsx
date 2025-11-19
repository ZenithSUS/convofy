"use client";

import Image from "next/image";

function UserImage({ userImage }: { userImage?: string }) {
  return (
    <div className="group relative">
      <div className="absolute inset-0 rounded-full bg-linear-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50 blur-lg transition-opacity group-hover:opacity-75 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400"></div>
      <Image
        src={userImage || "/default-avatar.png"}
        alt="User Avatar"
        width={100}
        height={100}
        className="relative h-28 w-28 rounded-full border-4 border-white object-cover shadow-xl dark:border-blue-800/50"
        priority
      />
    </div>
  );
}

export default UserImage;
