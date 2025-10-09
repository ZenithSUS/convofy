export type PusherState = {
  previous: string;
  current: string;
};

export type PusherConnectionStatus =
  | "connected"
  | "connecting"
  | "disconnected"
  | "error"
  | "unavailable";
