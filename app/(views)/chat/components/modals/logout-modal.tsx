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
import { useEffect, useState } from "react";

function LogoutModal({ userId }: { userId: string }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogout = async () => {
    await Promise.all([signOut(), client.post("/auth/logout", { id: userId })]);
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
          <AlertDialogAction className="bg-red-600" onClick={handleLogout}>
            Log out
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default LogoutModal;
