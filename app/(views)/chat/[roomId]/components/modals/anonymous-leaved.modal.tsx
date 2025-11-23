"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogOverlay,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";

function AnonyMouseLeavedModal() {
  const router = useRouter();

  return (
    <AlertDialog defaultOpen>
      <AlertDialogOverlay className="dialog-overlay">
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>You Already Leave the Room</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Find another user to join
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => router.push("/chat")}>
              I Understand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
}

export default AnonyMouseLeavedModal;
