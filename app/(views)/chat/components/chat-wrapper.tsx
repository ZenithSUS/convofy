"use client";

import { Session } from "@/app/(views)/chat/components/chat-header";
import useUserStatusChannel from "@/hooks/use-user-status-channel";

function ChatWrapper({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session;
}) {
  useUserStatusChannel(session);

  return <>{children}</>;
}

export default ChatWrapper;
