// components/theme-handler.tsx
"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function ThemeHandler() {
  const { data: session, status } = useSession();

  useEffect(() => {
    // When logged out, default to light theme
    if (status === "unauthenticated") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      return;
    }

    // When logged in, use user's preference
    if (status === "authenticated" && session?.user?.preferences?.theme) {
      const theme = session.user.preferences.theme;
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(theme);
    }
  }, [session?.user?.preferences?.theme, status]);

  return null;
}
