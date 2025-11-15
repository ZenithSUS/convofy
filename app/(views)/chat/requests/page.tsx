import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import RequestListClient from "./pages";
import { Session } from "@/app/(views)/chat/components/chat-header";

export default async function RequestListPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  return <RequestListClient serverSession={session as Session} />;
}
