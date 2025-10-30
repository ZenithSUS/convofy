import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import AccountPageClient from "@/app/(views)/chat/profile/pages/account";
import { Session } from "@/app/(views)/chat/components/chat-header";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  return <AccountPageClient serverSession={session as Session} />;
}
