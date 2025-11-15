"use client";

import { Bell } from "lucide-react";
import RequestsDropdown from "./request-dropdown";
import { RoomRequest } from "@/types/room";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useAcceptRoomInvite,
  useDeclineRoomInvite,
} from "@/hooks/use-room-invite";
import { Toast } from "@/components/providers/toast-provider";

function NotificationBell({ requests }: { requests: RoomRequest[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const { mutateAsync: acceptInvite, isPending: isAccepting } =
    useAcceptRoomInvite();
  const { mutateAsync: declineInvite, isPending: isDeclining } =
    useDeclineRoomInvite();

  const handleAccept = useCallback(
    async (roomId: string, userId: string) => {
      try {
        await acceptInvite({ roomId, userId });
        Toast.success("Request accepted successfully");
      } catch (error) {
        console.error("Error accepting room invite:", error);
        Toast.error("Error accepting room invite");
      }
    },
    [acceptInvite],
  );

  const handleDecline = useCallback(
    async (roomId: string, userId: string) => {
      try {
        await declineInvite({ userId, roomId });
        Toast.success("Request declined successfully");
      } catch (error) {
        console.error("Error declining room invite:", error);
        Toast.error("Error declining room invite");
      }
    },
    [declineInvite],
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full p-2 hover:bg-gray-100"
      >
        <Bell className="h-5 w-5" />
        {requests.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {requests.length}
          </span>
        )}
      </button>

      {isOpen && (
        <RequestsDropdown
          requests={requests}
          onAccept={handleAccept}
          onDecline={handleDecline}
          isAccepting={isAccepting}
          isDeclining={isDeclining}
          isOpen
          onClose={() => setIsOpen(!isOpen)}
          onViewAll={() => router.push("/chat/requests")}
        />
      )}
    </div>
  );
}

export default NotificationBell;
