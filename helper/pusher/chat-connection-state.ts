import { toast } from "sonner";

export const getPusherConnectionState = (currentState: string) => {
  // Handle different states
  switch (currentState) {
    case "connected":
      toast.success("Connected to Convofy");
      break;
    case "connecting":
      toast.info("Connecting to Convofy...");
      break;
    case "disconnected":
      toast.info("Connection lost. Reconnecting...");
      break;
    case "unavailable":
      toast.warning("Connection unavailable. Check your internet.");
      break;
    case "failed":
      toast.warning("Connection failed. Please refresh the page.");
      break;
  }
};

export default getPusherConnectionState;
