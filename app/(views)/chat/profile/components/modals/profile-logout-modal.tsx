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
import client from "@/services/axios";
import { PowerCircle } from "lucide-react";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";

function ProfileLogoutModal({ userId }: { userId: string }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogout = () => {
    signOut()
      .then(async () => {
        const response = await client.post("/auth/logout", { id: userId });
        console.log("Logout response:", response);
        return response.data;
      })
      .catch((error) => {
        console.error("Error logging out:", error);
      });
  };

  if (!isClient) return null;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          className="flex flex-1 cursor-pointer items-center"
        >
          <PowerCircle className="h-6 w-6 cursor-pointer" />
        </Button>
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
          <AlertDialogAction className="bg-red-600" onClick={handleLogout}>
            Log out
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default ProfileLogoutModal;
