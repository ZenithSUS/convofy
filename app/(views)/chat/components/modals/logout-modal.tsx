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
import { Loader2, LogOut, PowerCircle } from "lucide-react";
import { signOut } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface LogoutModalProps {
  userId: string;
  sessionId: string;
  role: "user" | "anonymous" | "admin";
}

function LogoutModal({ userId, sessionId, role }: LogoutModalProps) {
  const [isClient, setIsClient] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogout = useCallback(async () => {
    if (!isClient || isLoggingOut) return;

    const promiseMessage =
      role === "user" || role === "admin"
        ? "Logging out..."
        : "Ending session...";

    const successMessage =
      role === "user" || role === "admin"
        ? "Logged out successfully"
        : "Session ended successfully";

    try {
      setIsLoggingOut(true);
      toast.promise(
        async () => {
          // If the user's role is anonymous, delete all data associated with the user
          if (role === "anonymous") {
            await client.delete(`/users/${userId}`);
            await signOut({ callbackUrl: "/auth/login" });
            return;
          }

          // If the user's role is user or admin, log them out
          await client.post(`/sessions/${userId}/revoke`, {
            sessionId,
          });
          await Promise.all([
            signOut({ callbackUrl: "/auth/login" }),
            client.post("/auth/logout", { id: userId }),
          ]);
        },
        {
          loading: promiseMessage,
          success: successMessage,
          error: "Error logging out",
        },
      );
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      setIsLoggingOut(false);
    }
  }, [isClient, userId, sessionId, role, isLoggingOut]);

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
            {(role === "user" || role === "admin") &&
              "This will log you out of your account"}
            {role === "anonymous" &&
              "This will log you out of your account and delete all your data"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 text-white"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {role === "user" || role === "admin"
                  ? "Logging out..."
                  : "Ending session..."}
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                {role === "user" || role === "admin"
                  ? "Log out"
                  : "End session"}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default LogoutModal;
