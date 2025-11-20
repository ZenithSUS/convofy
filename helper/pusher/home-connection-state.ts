import { toast } from "sonner";

export const getHomePusherConnectionState = (currentState: string) => {
  // Handle different states
  switch (currentState) {
    case "connected":
      toast.success("Connected to Convofy");
      break;
    case "connecting":
      toast.info("Connecting to Pusher");
      break;
    case "disconnected":
      toast.info("Cannot connect to Convofy. Reconnecting...");
      break;
    case "unavailable":
      toast.warning("Failed to connect to Convofy. Check your internet.");
      break;
    case "failed":
      toast.error("Connection failed. Please refresh the page.");
      break;
  }
};

export default getHomePusherConnectionState;
