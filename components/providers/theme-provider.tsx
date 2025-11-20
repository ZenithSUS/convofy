"use client";

import useTheme from "@/store/theme-store";
import { useEffect, useRef } from "react";

interface ThemeProviderProps {
  children: React.ReactNode;
  serverTheme: "light" | "dark";
}

function ThemeProvider({ children, serverTheme }: ThemeProviderProps) {
  const { theme, setTheme } = useTheme();
  const isIntialized = useRef(false);

  useEffect(() => {
    if (!isIntialized.current) {
      setTheme(serverTheme);

      document.documentElement.classList.toggle("dark", serverTheme === "dark");

      isIntialized.current = true;
    }
  }, [serverTheme, setTheme]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  return <>{children}</>;
}

export default ThemeProvider;
