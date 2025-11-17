"use client";

import { Session } from "@/app/(views)/chat/components/chat-header";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import useUserConnectionStatus from "@/hooks/use-presence";

function ChatWrapper({
  children,
  serverSession,
}: {
  children: React.ReactNode;
  serverSession: Session;
}) {
  useUserConnectionStatus(serverSession);

  return (
    <SidebarProvider defaultOpen className="flex h-full w-full">
      <AppSidebar serverSession={serverSession} />
      <div className="w-full flex-1 overflow-hidden">{children}</div>
    </SidebarProvider>
  );
}

export default ChatWrapper;
