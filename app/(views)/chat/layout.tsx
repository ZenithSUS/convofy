"use client";

import useUserStatusChannel from "@/hooks/use-user-status-channel";
import { Session } from "@/app/(views)/chat/components/chat-header";
import { useSession } from "next-auth/react";

export default function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { data: session } = useSession();

  useUserStatusChannel(session as Session);

  return <>{children}</>;
}
