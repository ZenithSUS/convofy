"use client";

import useTheme from "@/store/theme-store";
import { useEffect, useRef } from "react";

interface ThemeProviderProps {
  children: React.ReactNode;
  serverTheme: "light" | "dark";
}

function ThemeProvider({ children, serverTheme }: ThemeProviderProps) {
  const { setTheme } = useTheme();
  const isIntialized = useRef(false);

  useEffect(() => {
    if (!isIntialized.current) {
      setTheme(serverTheme);
      isIntialized.current = true;
    }
  }, [serverTheme, setTheme]);

  return <>{children}</>;
}

export default ThemeProvider;
