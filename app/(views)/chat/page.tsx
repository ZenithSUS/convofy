import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Session } from "@/app/(views)/chat/components/chat-header";
import ChatListClient from "@/app/(views)/chat/pages/index";

export default async function ChatListPage() {
  const session = await getServerSession(authOptions);

  return <ChatListClient serverSession={session as Session} />;
}
