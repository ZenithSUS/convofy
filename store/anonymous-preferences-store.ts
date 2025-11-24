import { create } from "zustand";

interface AnonymousPreferencesState {
  interests: string[];
  language: string;
  currentInterest: string;
  setCurrentInterest: (interest: string) => void;
  setInterests: (interests: string[]) => void;
  setLanguage: (language: string) => void;
}

const useAnonymousPreferenceStore = create<AnonymousPreferencesState>(
  (set) => ({
    interests: [],
    language: "en",
    currentInterest: "",
    setCurrentInterest: (interest: string) =>
      set({ currentInterest: interest }),
    setInterests: (interests: string[]) => set({ interests }),
    setLanguage: (language: string) => set({ language }),
  }),
);

export default useAnonymousPreferenceStore;
