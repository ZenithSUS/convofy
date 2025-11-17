import {
  Message,
  MessageOutputTyping,
  MessageTyping,
  NewSeenMessage,
} from "@/types/message";

export type PusherState = {
  previous: string;
  current: string;
};

export type PusherConnectionStatus =
  | "connected"
  | "connecting"
  | "disconnected"
  | "failed"
  | "error"
  | "unavailable";

export type PusherSubsciption = {
  subscription_count: number;
};

export type PusherEventData =
  | PusherState
  | MessageTyping
  | Message
  | MessageOutputTyping
  | PusherSubsciption;

export type PusherCallback<T = unknown> = (data: T) => void;

export type PusherEventMap = {
  "pusher:subscription_error": PusherState;
  "pusher:subscription_succeeded": void;
  "pusher:subscription_count": PusherSubsciption;
  "new-message": Message;
  "delete-message": Message;
  "edit-message": Message;
  "update-seen-by": NewSeenMessage;
  "typing-start": MessageOutputTyping;
  "typing-end": MessageOutputTyping;
  "status-update": string;
  state_change: PusherState;
  connected: void;
  disconnected: void;
  connecting: void;
  unavailable: void;
  failed: void;
  error: Error;
};

export type PusherChannel = {
  name: string;

  // Generic bind for flexibility
  bind<K extends keyof PusherEventMap>(
    eventName: K,
    callback: (data: PusherEventMap[K]) => void,
  ): void;

  // Allow binding to custom events
  bind(eventName: string, callback: PusherCallback): void;
  unbind(eventName: string, callback?: PusherCallback): void;
  unbind_all(): void;
  trigger(eventName: string, data: unknown): void;
};
