import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import AccountPageClient from "@/app/(views)/chat/profile/pages/account";
import { Session } from "@/app/(views)/chat/components/chat-header";
import { redirect } from "next/navigation";

export default async function AccountPage() {
  const session = await getServerSession(authOptions).catch(() => null);

  if (!session) {
    // Redirect to login if no session
    redirect("auth/login");
  }

  return <AccountPageClient serverSession={session as Session} />;
}
