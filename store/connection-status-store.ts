import { PusherConnectionStatus } from "@/types/pusher";
import { create } from "zustand";

interface ConnectionStatusStore {
  status: PusherConnectionStatus | string;
  setStatus: (status: PusherConnectionStatus | string) => void;
}

const useConnectionStatus = create<ConnectionStatusStore>((set) => ({
  status: "connecting",
  setStatus: (status) => set({ status }),
}));

export default useConnectionStatus;
