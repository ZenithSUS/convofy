import { authOptions } from "@/lib/auth";
import { getServerSession, Session } from "next-auth";
import RoomPageClient from "./pages";

export default async function RoomPage() {
  const session = await getServerSession(authOptions);

  return <RoomPageClient session={session as Session} />;
}
