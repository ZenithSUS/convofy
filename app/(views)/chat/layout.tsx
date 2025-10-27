import ChatWrapper from "./components/chat-wrapper";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Session } from "@/app/(views)/chat/components/chat-header";

export default async function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <ChatWrapper serverSession={session as Session}>{children}</ChatWrapper>
  );
}
