import { authOptions } from "@/lib/auth";
import DeniedPageClient from "../pages/denied";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function DeniedPage() {
  const session = await getServerSession(authOptions).catch(() => null);

  if (!session) {
    redirect("/auth/login");
  }

  return <DeniedPageClient />;
}
