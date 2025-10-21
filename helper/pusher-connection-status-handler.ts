import { PusherConnectionStatus, PusherState } from "@/types/pusher";
import { toast } from "react-toastify";

class ConnectionStatusHandler {
  constructor(
    private isMountedRef: React.MutableRefObject<boolean>,
    private setConnectionStatus: (status: PusherConnectionStatus) => void,
    private getPusherConnectionState: (status: PusherConnectionStatus) => void,
    private showErrorConnectionMessage: (error: Error) => void,
  ) {}

  handleStateChange = (states: PusherState) => {
    if (this.isMountedRef.current) {
      const currentState = states.current as PusherConnectionStatus;
      this.setConnectionStatus(currentState);
      this.getPusherConnectionState(currentState);
    }
  };

  handleConnected = () => {
    if (this.isMountedRef.current) {
      this.setConnectionStatus("connected");
    }
  };

  handleDisconnected = () => {
    if (this.isMountedRef.current) {
      this.setConnectionStatus("disconnected");
      toast.warn("Connection lost. Reconnecting...");
    }
  };

  handleConnecting = () => {
    if (this.isMountedRef.current) {
      this.setConnectionStatus("connecting");
    }
  };

  handleUnavailable = () => {
    if (this.isMountedRef.current) {
      this.setConnectionStatus("unavailable");
      toast.error("Connection unavailable. Check your network.");
    }
  };

  handleFailed = () => {
    if (this.isMountedRef.current) {
      this.setConnectionStatus("failed");
      toast.error("Failed to connect. Please refresh the page.");
    }
  };

  handleError = (error: unknown) => {
    const err = error as Error;
    console.error("Pusher connection error:", err);
    if (this.isMountedRef.current) {
      this.setConnectionStatus("error");
      this.showErrorConnectionMessage(err);
    }
  };
}

export default ConnectionStatusHandler;
