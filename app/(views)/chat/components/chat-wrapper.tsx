"use client";

import { Session } from "@/app/(views)/chat/components/chat-header";
import useUserConnectionStatus from "@/hooks/use-presence";

function ChatWrapper({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session;
}) {
  useUserConnectionStatus(session);

  return <>{children}</>;
}

export default ChatWrapper;
