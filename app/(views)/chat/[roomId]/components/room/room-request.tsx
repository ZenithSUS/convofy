"use client";

import { Button } from "@/components/ui/button";
import {
  useAcceptRoomInvite,
  useDeclineRoomInvite,
} from "@/hooks/use-room-invite";
import { RoomContent } from "@/types/room";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";

interface RoomRequestProps {
  userId: string;
  roomId: string;
}

function RoomRequest({ userId, roomId }: RoomRequestProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { mutateAsync: acceptInvite, isPending: isAccepting } =
    useAcceptRoomInvite();
  const { mutateAsync: declineInvite, isPending: isDeclining } =
    useDeclineRoomInvite();

  const isProcessing = useMemo(() => {
    return isAccepting || isDeclining;
  }, [isAccepting, isDeclining]);

  const handleAccept = useCallback(async () => {
    try {
      toast.promise(
        async () => {
          await acceptInvite({ roomId, userId });

          queryClient.setQueryData(
            ["room", roomId],
            (prevRoom: RoomContent) => {
              return {
                ...prevRoom,
                isPending: false,
                isAccepted: true,
              };
            },
          );
        },
        {
          success: "You have joined the room!",
          loading: "Accepting room invite...",
          error: "Error accepting room invite",
        },
      );
      router.push(`/chat/${roomId}`);
    } catch (error) {
      console.error("Error accepting room invite:", error);
      toast.error("Error accepting room invite");
    }
  }, [acceptInvite, userId, roomId, queryClient, router]);

  const handleDecline = useCallback(async () => {
    try {
      toast.promise(
        async () => {
          await declineInvite({ userId, roomId });
        },
        {
          success: "You have declined the room invite.",
          loading: "Declining room invite...",
          error: "Error declining room invite",
        },
      );
    } catch (error) {
      console.error("Error declining room invite:", error);
      toast.error("Error declining room invite");
    }
  }, [declineInvite, userId, roomId]);

  return (
    <div className="flex flex-col items-center gap-2 border-t border-gray-300 p-5">
      <h1 className="text-md text-center font-semibold">
        This user has invited you chat
      </h1>

      <div className="flex items-center gap-2">
        <Button
          variant="default"
          disabled={isProcessing}
          onClick={handleAccept}
          className="rounded-xl bg-linear-to-r from-blue-600 to-purple-600 font-semibold text-white shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isProcessing ? "Processing..." : "Accept"}
        </Button>
        <Button
          variant="destructive"
          disabled={isProcessing}
          onClick={handleDecline}
          className="rounded-xl bg-linear-to-r from-red-600 to-pink-600 font-semibold text-white shadow-lg transition-all duration-300 hover:from-red-700 hover:to-pink-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isProcessing ? "Processing..." : "Decline"}
        </Button>
      </div>
    </div>
  );
}

export default RoomRequest;
