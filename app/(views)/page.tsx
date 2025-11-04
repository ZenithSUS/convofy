"use server";

import { getServerSession } from "next-auth/next";
import HomeScreen from "@/app/(views)/pages";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions).catch(() => null);

  if (!!session) {
    redirect("/chat");
  }

  return <HomeScreen />;
}
