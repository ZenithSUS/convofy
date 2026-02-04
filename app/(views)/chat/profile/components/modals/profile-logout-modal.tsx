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
import { Button } from "@/components/ui/button";
import client from "@/lib/axios";
import { LogOut, Loader2, AlertTriangle } from "lucide-react";
import { signOut } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface ProfileLogoutModalProps {
  userId: string;
  sessionId: string;
  role: "user" | "anonymous" | "admin";
}

function ProfileLogoutModal({
  userId,
  sessionId,
  role,
}: ProfileLogoutModalProps) {
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

    setIsLoggingOut(true);

    try {
      toast.promise(
        async () => {
          await client.post(`/sessions/${userId}/revoke`, { sessionId });

          // If the user's role is anonymous, delete all data associated with the user
          if (role === "anonymous") {
            await Promise.all([
              client.delete(`/users/${userId}/media`),
              client.delete(`/users/${userId}`),
            ]);
          }

          await Promise.all([
            client.post("/auth/logout", { id: userId }),
            signOut({ callbackUrl: "/auth/login" }),
          ]);
        },
        {
          success: successMessage,
          loading: promiseMessage,
          error: "Failed to log out. Please try again.",
        },
      );
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to log out. Please try again.");
      setIsLoggingOut(false);
    }
  }, [isClient, isLoggingOut, userId, sessionId, role]);

  if (!isClient || !userId || !sessionId) return null;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="group rounded-lg border border-white/20 bg-white/10 backdrop-blur-md transition-all duration-300 hover:bg-red-500/20 hover:shadow-lg"
          aria-label="Log out"
        >
          <LogOut className="h-5 w-5 text-white transition-transform duration-300 group-hover:scale-110" />
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <AlertDialogTitle className="text-center text-xl">
            Log Out?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground text-center">
            {role === "user" ||
              (role === "admin" &&
                "Are you sure you want to log out? You'll need to sign in again to access your account.")}
            {role === "anonymous" &&
              "Are you sure you want to log out? This will delete all your data."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="gap-2 sm:gap-4">
          <AlertDialogCancel
            disabled={isLoggingOut}
            className="transition-all duration-200 hover:bg-gray-100"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="bg-linear-to-r from-red-600 to-red-700 text-white transition-all duration-200 hover:from-red-700 hover:to-red-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
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

export default ProfileLogoutModal;
