import { PusherConnectionStatus, PusherState } from "@/types/pusher";
import { toast } from "react-toastify";

class ConnectionStatusHandler {
  /**
   * Constructor for the ConnectionStatusHandler class
   * @param isMountedRef - reference to track if component is mounted
   * @param setConnectionStatus - callback to update connection status state
   * @param onConnectionStateChange - callback when connection state changes
   * @param showErrorConnectionMessage - callback to display connection errors
   */
  constructor(
    private isMountedRef: React.RefObject<boolean>,
    private setConnectionStatus: (status: PusherConnectionStatus) => void,
    private onConnectionStateChange: (status: PusherConnectionStatus) => void,
    private showErrorConnectionMessage: (error: Error) => void,
  ) {}

  /**
   * Handles Pusher connection state changes
   * Updates local state and notifies listeners of the change
   */
  handleStateChange = (states: PusherState) => {
    if (this.isMountedRef.current) {
      const currentState = states.current as PusherConnectionStatus;
      this.setConnectionStatus(currentState);
      this.onConnectionStateChange(currentState);
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
    console.error("Pusher connection error:", error);

    if (this.isMountedRef.current) {
      this.setConnectionStatus("error");

      // Safely convert unknown error to Error type
      const err = error instanceof Error ? error : new Error(String(error));

      this.showErrorConnectionMessage(err);
    }
  };
}

export default ConnectionStatusHandler;
