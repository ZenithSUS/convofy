import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import ProfilePageClient from "./pages";
import { Session } from "@/app/(views)/chat/components/chat-header";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions).catch(() => null);

  return <ProfilePageClient serverSession={session as Session} />;
}
