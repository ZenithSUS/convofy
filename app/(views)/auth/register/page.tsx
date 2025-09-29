"use server";

import RegisterScreen from "@/components/pages/register";

export default async function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900">
      <RegisterScreen />
    </div>
  );
}
