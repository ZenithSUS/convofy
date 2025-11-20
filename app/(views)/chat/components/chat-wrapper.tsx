"use client";

import { Session } from "@/app/(views)/chat/components/chat-header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import useUserConnectionStatus from "@/hooks/use-presence";
import ThemeProvider from "@/components/providers/theme-provider";

function ChatWrapper({
  children,
  serverSession,
}: {
  children: React.ReactNode;
  serverSession: Session;
}) {
  useUserConnectionStatus(serverSession);

  return (
    <ThemeProvider serverTheme={serverSession.user.preferences.theme}>
      <SidebarProvider defaultOpen className="flex h-full w-full">
        <AppSidebar serverSession={serverSession} />
        <div className="w-full flex-1 overflow-hidden">{children}</div>
      </SidebarProvider>
    </ThemeProvider>
  );
}

export default ChatWrapper;
