import { Message } from "@/types/message";
import { create } from "zustand";

interface MessageStore {
  messages: Message[];
  setMessages: (messages: Message[]) => void;
}

const useMessage = create<MessageStore>((set) => ({
  messages: [],
  setMessages: (messages) => set({ messages }),
}));

export default useMessage;
