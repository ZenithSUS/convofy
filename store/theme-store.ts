import { create } from "zustand";

interface ThemeStore {
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
}

const useTheme = create<ThemeStore>((set) => ({
  theme:
    typeof window !== "undefined"
      ? localStorage.getItem("theme") === "dark"
        ? "dark"
        : "light"
      : "light",
  setTheme: (theme) => set({ theme }),
}));

export default useTheme;
