import EditPageClient from "@/app/(views)/chat/profile/pages/edit";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { Session } from "@/app/(views)/chat/components/chat-header";
import { redirect } from "next/navigation";

export default async function EditPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    // Redirect to login if no session
    redirect("/auth/login");
  }

  if (session.user.isAnonymous && session.user.role === "anonymous") {
    // Redirect anonymous users to a different page
    redirect("/chat/denied");
  }

  return <EditPageClient serverSession={session as Session} />;
}
