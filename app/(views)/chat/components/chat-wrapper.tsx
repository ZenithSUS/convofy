"use client";

import { Session } from "@/app/(views)/chat/components/chat-header";
import useUserConnectionStatus from "@/hooks/use-presence";

function ChatWrapper({
  children,
  serverSession,
}: {
  children: React.ReactNode;
  serverSession: Session;
}) {
  useUserConnectionStatus(serverSession);

  return <>{children}</>;
}

export default ChatWrapper;
