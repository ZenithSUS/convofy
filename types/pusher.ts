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

export type PusherSubsciption = {
  subscription_count: number;
};

export type PusherChannel = {
  name: string;
  unbind_all: () => void;
};
