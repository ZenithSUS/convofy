"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import Image from "next/image";

import LogoutModal from "./logout-modal";

export interface Session {
  user: {
    id: string;
    image: string;
    name: string;
    email: string;
  };
}

function ChatHeader({ session }: { session: Session }) {
  const isMobile = useIsMobile();

  return (
    <div className="mb-4 flex items-center justify-between gap-2 border-b pb-2">
      <div>
        <h1 className="text-2xl font-bold">Convofy</h1>
      </div>

      {session && (
        <div className="flex items-center space-x-2">
          {session.user.image && (
            <Image
              src={session.user.image || "/default-avatar.png"}
              alt="User Avatar"
              width={40}
              height={40}
              className="h-10 w-10 rounded-full"
            />
          )}
          <div className="text-md text-black">
            {(isMobile
              ? session.user.name?.split(" ")[0]
              : session.user.name) || session.user.email}
          </div>

          <LogoutModal />
        </div>
      )}
    </div>
  );
}

export default ChatHeader;
