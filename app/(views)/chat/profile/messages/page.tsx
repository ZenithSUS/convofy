import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import MessagesPageClient from "../pages/messages";
import { Session } from "@/app/(views)/chat/components/chat-header";

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);

  return <MessagesPageClient session={session as Session} />;
}
