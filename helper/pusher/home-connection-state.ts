import { toast } from "react-toastify";

export const getHomePusherConnectionState = (currentState: string) => {
  // Handle different states
  switch (currentState) {
    case "connected":
      toast.success("Connected to Convofy");
      break;
    case "connecting":
      console.log("Connecting to Pusher");
      break;
    case "disconnected":
      toast.warn("Cannot connect to Convofy. Reconnecting...");
      break;
    case "unavailable":
      toast.error("Failed to connect to Convofy. Check your internet.");
      break;
    case "failed":
      toast.error("Connection failed. Please refresh the page.");
      break;
  }
};

export default getHomePusherConnectionState;
