import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import RoomPageClient from "@/app/(views)/chat/[roomId]/pages";
import { Session } from "@/app/(views)/chat/components/chatpage/chat-header";
import { redirect } from "next/navigation";

export default async function RoomPage() {
  const session = await getServerSession(authOptions).catch(() => null);

  if (!session) {
    // Redirect to login if no session
    redirect("/auth/login");
  }

  return <RoomPageClient serverSession={session as Session} />;
}
