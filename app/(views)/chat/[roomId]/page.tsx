import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import RoomPageClient from "@/app/(views)/chat/[roomId]/pages";
import { Session } from "@/app/(views)/chat/components/chat-header";

export default async function RoomPage() {
  const session = await getServerSession(authOptions).catch(() => null);

  return <RoomPageClient serverSession={session as Session} />;
}
