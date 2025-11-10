import VerifyEmailChangePageClient from "@/app/(views)/auth/pages/verify-email-change";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Session } from "@/app/(views)/chat/components/chat-header";

export default async function VerifyEmailChangePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  return <VerifyEmailChangePageClient serverSession={session as Session} />;
}
