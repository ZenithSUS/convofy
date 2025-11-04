import CreateRoomClient from "@/app/(views)/chat/create/pages/index";
import { Session } from "@/app/(views)/chat/components/chat-header";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

async function CreateRoomPage() {
  const session = await getServerSession(authOptions).catch(() => null);

  if (!session) {
    // Redirect to login if no session
    redirect("auth/login");
  }

  return <CreateRoomClient serverSession={session as Session} />;
}

export default CreateRoomPage;
