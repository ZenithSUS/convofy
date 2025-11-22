import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import ProfilePageClient from "./pages";
import { Session } from "@/app/(views)/chat/components/chatpage/chat-header";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions).catch(() => null);

  if (!session) {
    // Redirect to login if no session
    redirect("/auth/login");
  }

  return <ProfilePageClient serverSession={session as Session} />;
}
