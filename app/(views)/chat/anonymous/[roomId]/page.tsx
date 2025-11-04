import { authOptions } from "@/lib/auth";
import { getServerSession, Session } from "next-auth";
import AnonymousPageClient from "../pages/room";

export default async function AnonymousChatPage() {
  const session = await getServerSession(authOptions).catch(() => null);

  return <AnonymousPageClient session={session as Session} />;
}
