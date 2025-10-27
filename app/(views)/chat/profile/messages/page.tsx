import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { Session } from "@/app/(views)/chat/components/chat-header";
import MessagesPageClient from "@/app/(views)/chat/profile/pages/messages";

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);

  return <MessagesPageClient serverSession={session as Session} />;
}
