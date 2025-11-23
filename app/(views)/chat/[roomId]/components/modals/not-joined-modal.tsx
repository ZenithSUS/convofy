"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogOverlay,
} from "@/components/ui/alert-dialog";
import { useJoinRoom } from "@/hooks/use-rooms";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

interface Props {
  roomId: string;
  userId: string;
}

function NotJoinedModal({ roomId, userId }: Props) {
  const router = useRouter();
  const { mutateAsync: joinRoom } = useJoinRoom();
  const [isJoining, startJoining] = useTransition();

  const handleJoin = async () => {
    startJoining(async () => {
      const response = await joinRoom({ roomId, userId });

      if (response) {
        router.push(`/chat/${roomId}`);
      }
    });
  };

  return (
    <AlertDialog defaultOpen>
      <AlertDialogOverlay className="dialog-overlay">
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Not a member</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              You are not a member of this group
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => router.push("/chat")}
              disabled={isJoining}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleJoin} disabled={isJoining}>
              Join Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
}

export default NotJoinedModal;
