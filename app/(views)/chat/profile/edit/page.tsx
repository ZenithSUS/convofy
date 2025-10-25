import EditPageClient from "@/app/(views)/chat/profile/pages/edit";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { Session } from "@/app/(views)/chat/components/chat-header";

export default async function EditPage() {
  const session = await getServerSession(authOptions);

  return <EditPageClient session={session as Session} />;
}
