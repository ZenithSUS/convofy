import { Toast } from "@/components/providers/toast-provider";

export const getHomePusherConnectionState = (currentState: string) => {
  // Handle different states
  switch (currentState) {
    case "connected":
      Toast.success("Connected to Convofy");
      break;
    case "connecting":
      Toast.info("Connecting to Pusher");
      break;
    case "disconnected":
      Toast.info("Cannot connect to Convofy. Reconnecting...");
      break;
    case "unavailable":
      Toast.warn("Failed to connect to Convofy. Check your internet.");
      break;
    case "failed":
      Toast.error("Connection failed. Please refresh the page.");
      break;
  }
};

export default getHomePusherConnectionState;
