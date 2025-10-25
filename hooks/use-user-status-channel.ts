"use client";

import { useEffect } from "react";
import { Session } from "@/app/(views)/chat/components/chat-header";
import { subscribeToUserStatus } from "@/services/pusher/user-status-manager";
import { useSession } from "next-auth/react";

export default function useUserStatusChannel(session: Session) {
  const { update } = useSession();
  useEffect(() => {
    if (!session?.user?.id) return;

    // Handle status update
    const handleStatusUpdate = (status: string) => {
      console.log("User status updated:", status);
      update({ ...session, user: { ...session.user, status } });
      return;
    };

    // Subscribe to the user status channel
    subscribeToUserStatus(session.user.id, handleStatusUpdate);
  }, [session?.user?.id, update, session]);
}
