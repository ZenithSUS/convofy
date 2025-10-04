import CreateRoomForm from "@/app/(views)/chat/components/create-room-form";
import { Session } from "@/app/(views)/chat/components/chat-header";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

async function CreateRoomPage() {
  const session = await getServerSession(authOptions);

  return <CreateRoomForm session={session as Session} />;
}

export default CreateRoomPage;
