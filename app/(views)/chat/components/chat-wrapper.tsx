"use client";

import { Session } from "@/app/(views)/chat/components/chat-header";
import useUserConnectionStatus from "@/hooks/use-presence";
import useUserStatusChannel from "@/hooks/use-user-status-channel";

function ChatWrapper({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session;
}) {
  useUserStatusChannel(session);
  useUserConnectionStatus(session);

  return <>{children}</>;
}

export default ChatWrapper;
