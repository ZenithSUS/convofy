import ChatWrapper from "./components/chat-wrapper";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Session } from "@/app/(views)/chat/components/chatpage/chat-header";
import { redirect } from "next/navigation";

export default async function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions).catch(() => null);

  if (!session) {
    // Redirect to login if no session
    redirect("/auth/login");
  }

  return (
    <ChatWrapper serverSession={session as Session}>{children}</ChatWrapper>
  );
}
