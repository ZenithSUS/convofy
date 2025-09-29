"use server";

import LoginScreen from "@/components/pages/login";

export default async function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <LoginScreen />
    </div>
  );
}
