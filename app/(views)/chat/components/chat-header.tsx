"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import Image from "next/image";

import LogoutModal from "./modals/logout-modal";
import { useRouter } from "next/navigation";

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
    providers: string[];
    linkedAccounts: {
      provider: string;
      providerAccount: string;
      providerAccountId: string;
    }[];
  };
}

function ChatHeader({ session }: { session: Session }) {
  const isMobile = useIsMobile();
  const router = useRouter();

  if (!session) return null;

  return (
    <div className="mb-4 flex items-center justify-between gap-2 border-b pb-2">
      <div>
        <h1 className="text-2xl font-bold">Convofy</h1>
      </div>

      {session && (
        <div className="flex cursor-pointer items-center space-x-2">
          <Image
            src={session.user.image || "/default-avatar.png"}
            alt="User Avatar"
            width={40}
            height={40}
            className="h-10 w-10 rounded-full"
            onClick={() => router.push("/chat/profile")}
          />

          <div
            className="text-md text-black"
            onClick={() => router.push("/chat/profile")}
          >
            {(isMobile
              ? session.user.name?.split(" ")[0]
              : session.user.name) || session.user.email}
          </div>

          <LogoutModal userId={session.user.id} />
        </div>
      )}
    </div>
  );
}

export default ChatHeader;
