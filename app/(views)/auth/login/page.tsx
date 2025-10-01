"use server";

import { getServerSession } from "next-auth";
import LoginScreen from "@/components/pages/login";
import ChatPage from "../../chat/page";

export default async function LoginPage() {
  const session = await getServerSession();

  if (session) {
    console.log("User is already authenticated, redirecting to home page.");
    return <ChatPage />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <LoginScreen />
    </div>
  );
}
