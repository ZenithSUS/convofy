import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import PreferencesPageClient from "../pages/preferences";
import { Session } from "@/app/(views)/chat/components/chat-header";

export default async function PreferencesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  return <PreferencesPageClient serverSession={session as Session} />;
}
