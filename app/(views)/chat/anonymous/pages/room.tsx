"use client";

import { Session } from "next-auth";
import AnonymousRoomHeader from "../components/anon-room-header";

function AnonymousPageClient({ session }: { session: Session }) {
  if (!session) return null;

  return (
    <div className="flex flex-1 flex-col gap-2">
      <AnonymousRoomHeader />
    </div>
  );
}

export default AnonymousPageClient;
