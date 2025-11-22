import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import RequestListClient from "./pages";
import { Session } from "@/app/(views)/chat/components/chatpage/chat-header";

export default async function RequestListPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  if (session.user.role === "anonymous" || session.user.isAnonymous) {
    redirect("/chat/denied");
  }

  return <RequestListClient serverSession={session as Session} />;
}
