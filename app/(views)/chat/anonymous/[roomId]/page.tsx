import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import AnonymousPageClient from "./pages";
import { Session } from "@/app/(views)/chat/components/chat-header";

export default async function AnonymousChatPage() {
  const session = await getServerSession(authOptions).catch(() => null);

  return <AnonymousPageClient session={session as Session} />;
}
