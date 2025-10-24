"use client";

import { useEffect } from "react";
import { Session } from "@/app/(views)/chat/components/chat-header";
import {
  subscribeToUserStatus,
  unsubscribeFromUserStatus,
} from "@/services/pusher/user-status-manager";

export default function useUserStatusChannel(session: Session) {
  useEffect(() => {
    if (!session?.user?.id) return;

    // Handle status update
    const handleStatusUpdate = (status: string) => {
      console.log("User status updated:", status);
      return;
    };

    // Subscribe to the user status channel
    subscribeToUserStatus(session.user.id, handleStatusUpdate);

    return () => {
      unsubscribeFromUserStatus();
    };
  }, [session?.user?.id]);
}
