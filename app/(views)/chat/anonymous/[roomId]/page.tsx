import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import AnonymousPageClient from "./pages";
import { Session } from "@/app/(views)/chat/components/chat-header";
import { redirect } from "next/navigation";

export default async function AnonymousChatPage() {
  const session = await getServerSession(authOptions).catch(() => null);

  if (!session) {
    // Redirect to login if no session
    redirect("/auth/login");
  }

  return <AnonymousPageClient session={session as Session} />;
}
