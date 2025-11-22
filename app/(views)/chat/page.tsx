import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Session } from "@/app/(views)/chat/components/chatpage/chat-header";
import ChatListClient from "@/app/(views)/chat/pages/index";
import { redirect } from "next/navigation";

export default async function ChatListPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    // Redirect to login if no session
    redirect("/auth/login");
  }

  return <ChatListClient serverSession={session as Session} />;
}
