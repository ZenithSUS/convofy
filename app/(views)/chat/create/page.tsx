import CreateRoomClient from "@/app/(views)/chat/create/pages/index";
import { Session } from "@/app/(views)/chat/components/chat-header";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

async function CreateRoomPage() {
  const session = await getServerSession(authOptions).catch(() => null);

  if (!session) {
    // Redirect to login if no session
    redirect("/auth/login");
  }

  if (session.user.isAnonymous && session.user.role === "anonymous") {
    // Redirect anonymous users to a different page
    redirect("/chat");
  }

  return <CreateRoomClient serverSession={session as Session} />;
}

export default CreateRoomPage;
