import MediaPageClient from "@/app/(views)/chat/profile/pages/media";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { Session } from "@/app/(views)/chat/components/chat-header";

export default async function MediaPage() {
  const session = await getServerSession(authOptions);

  return <MediaPageClient session={session as Session} />;
}
