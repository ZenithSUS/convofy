import { toast } from "react-toastify";

export const getPusherConnectionState = (currentState: string) => {
  // Handle different states
  switch (currentState) {
    case "connected":
      toast.success("Connected to Room");
      break;
    case "connecting":
      console.log("Connecting to Room");
      break;
    case "disconnected":
      toast.warn("Connection lost. Reconnecting...");
      break;
    case "unavailable":
      toast.error("Connection unavailable. Check your internet.");
      break;
    case "failed":
      toast.error("Connection failed. Please refresh the page.");
      break;
  }
};

export default getPusherConnectionState;
