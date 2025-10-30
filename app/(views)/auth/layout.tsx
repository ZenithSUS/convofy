import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { headers } from "next/headers";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  // Get the current pathname from headers
  const currentPath = (await headers()).get("x-pathname") || "";

  // If user is logged in and NOT on /auth/error, redirect to /chat
  if (session && !currentPath.includes("/auth/error")) {
    redirect("/chat");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900">
      {children}
    </div>
  );
}
