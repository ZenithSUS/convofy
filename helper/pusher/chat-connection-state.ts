import { Toast } from "@/components/providers/toast-provider";

export const getPusherConnectionState = (currentState: string) => {
  // Handle different states
  switch (currentState) {
    case "connected":
      Toast.success("Connected to Convofy");
      break;
    case "connecting":
      Toast.info("Connecting to Convofy...");
      break;
    case "disconnected":
      Toast.info("Connection lost. Reconnecting...");
      break;
    case "unavailable":
      Toast.warn("Connection unavailable. Check your internet.");
      break;
    case "failed":
      Toast.warn("Connection failed. Please refresh the page.");
      break;
  }
};

export default getPusherConnectionState;
