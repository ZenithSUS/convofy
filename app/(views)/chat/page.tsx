import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import ChatListClient from "@/app/(views)/chat/components/chat-list-client";
import { Session } from "@/app/(views)/chat/components/chat-header";

export default async function ChatListPage() {
  const session = await getServerSession(authOptions);

  return <ChatListClient session={session as Session} />;
}
