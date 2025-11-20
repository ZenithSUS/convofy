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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import client from "@/lib/axios";
import { PowerCircle } from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface LogoutModalProps {
  userId: string;
  sessionId: string;
}

function LogoutModal({ userId, sessionId }: LogoutModalProps) {
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogout = async () => {
    if (!isClient) return;

    try {
      toast.promise(
        async () => {
          await client.post(`/sessions/${userId}/revoke`, {
            sessionId,
          });

          await Promise.all([
            signOut({ redirect: false }),
            client.post("/auth/logout", { id: userId }),
          ]);
        },
        {
          loading: "Logging out...",
          success: "Logged out successfully",
          error: "Error logging out",
        },
      );

      setTimeout(() => {
        localStorage.clear();
        router.refresh();
        router.push("/auth/login");
      }, 500);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (!isClient) return null;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <PowerCircle className="mr-2 h-6 w-6 cursor-pointer" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            This will log you out of your account
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 text-white"
            onClick={handleLogout}
          >
            Log out
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default LogoutModal;
