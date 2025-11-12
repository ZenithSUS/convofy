"use client";

import AnonymousRoomHeader from "@/app/(views)/chat/anonymous/components/anon-room-header";
import { Session } from "@/app/(views)/chat/components/chat-header";

function AnonymousPageClient({ session }: { session: Session }) {
  if (!session) return null;

  return (
    <div className="flex flex-1 flex-col gap-2">
      <AnonymousRoomHeader />
    </div>
  );
}

export default AnonymousPageClient;
