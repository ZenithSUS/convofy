import { InfiniteData, QueryClient } from "@tanstack/react-query";
import { Message, MessageOutputTyping } from "@/types/message";
import { PusherChannel, PusherState, PusherSubsciption } from "@/types/pusher";
import { toast } from "react-toastify";

export class ChannelEventHandler {
  /**
   * Constructor for the ChannelEventHandler class
   * @param queryClient - The tanstack query client instance
   * @param roomId - The chat room ID
   * @param currentUserId - The current user ID logged in
   * @param isMountedRef - Reference to track if the component is mounted
   * @param currentRoomIdRef - Reference to track the current room ID
   * @param setTypingUsers - Callback to update the typing users state
   */
  constructor(
    private queryClient: QueryClient,
    private roomId: string,
    private currentUserId: string,
    private isMountedRef: React.RefObject<boolean>,
    private currentRoomIdRef: React.RefObject<string | null>,
    private setTypingUsers: React.Dispatch<
      React.SetStateAction<Map<string, MessageOutputTyping>>
    >,
  ) {}

  /**
   * Binds all channel events to the provided Pusher channel
   */
  bindAllEvents(channel: PusherChannel) {
    this.bindSubscriptionEvents(channel);
    this.bindMessageEvents(channel);
    this.bindTypingEvents(channel);
  }

  /**
   * Unbinds all events from the channel
   */
  unbindAllEvents(channel: PusherChannel) {
    channel.unbind_all();
  }

  /**
   * Binds subscription-related events
   */
  private bindSubscriptionEvents(channel: PusherChannel) {
    channel.bind("pusher:subscription_error", this.handleSubscriptionError);
    channel.bind(
      "pusher:subscription_succeeded",
      this.handleSubscriptionSucceeded,
    );
    channel.bind("pusher:subscription_count", this.handleSubscriptionCount);
  }

  /**
   * Binds message-related events
   */
  private bindMessageEvents(channel: PusherChannel) {
    channel.bind("new-message", this.handleNewMessage);
    channel.bind("delete-message", this.handleDeleteMessage);
    channel.bind("edit-message", this.handleEditMessage);
  }

  /**
   * Binds typing indicator events
   */
  private bindTypingEvents(channel: PusherChannel) {
    channel.bind("typing-start", this.handleTypingStart);
    channel.bind("typing-end", this.handleTypingEnd);
  }

  private handleSubscriptionError = (status: PusherState) => {
    console.error("Subscription error:", status);
    if (this.isMountedRef.current) {
      toast.error("Failed to subscribe to room. Please refresh.");
    }
  };

  private handleSubscriptionSucceeded = () => {
    console.log(`Successfully subscribed to channel: chat-${this.roomId}`);
  };

  private handleSubscriptionCount = (data: PusherSubsciption) => {
    console.log(
      `Subscription count for chat-${this.roomId}:`,
      data.subscription_count,
    );
  };

  private handleNewMessage = (data: Message) => {
    if (
      !this.isMountedRef.current ||
      this.currentRoomIdRef.current !== this.roomId
    ) {
      return;
    }

    this.queryClient.setQueryData(
      ["messages", this.roomId],
      (old: InfiniteData<Message[]> | undefined) => {
        if (!old) {
          return {
            pages: [[data]],
            pageParams: [],
          };
        }

        const allMessages = old.pages.flat();
        const messageExists = allMessages.some((msg) => msg._id === data._id);
        if (messageExists) return old;

        const newPages = [...old.pages];
        newPages[0] = [data, ...newPages[0]];

        return { ...old, pages: newPages };
      },
    );

    this.queryClient.invalidateQueries({ queryKey: ["rooms"] });
  };

  private handleDeleteMessage = (data: Message) => {
    if (
      !this.isMountedRef.current ||
      this.currentRoomIdRef.current !== this.roomId
    ) {
      return;
    }

    this.queryClient.setQueryData(
      ["messages", this.roomId],
      (old: InfiniteData<Message[]> | undefined) => {
        if (!old) return old;

        const newPages = old.pages.map((page) =>
          page.filter((msg) => msg._id !== data._id),
        );

        return { ...old, pages: newPages };
      },
    );

    this.queryClient.invalidateQueries({ queryKey: ["rooms"] });
  };

  private handleEditMessage = (data: Message) => {
    if (
      !this.isMountedRef.current ||
      this.currentRoomIdRef.current !== this.roomId
    ) {
      return;
    }

    this.queryClient.setQueryData(
      ["messages", this.roomId],
      (old: InfiniteData<Message[]> | undefined) => {
        if (!old) return old;

        const newPages = old.pages.map((page) => {
          if (!page.some((msg) => msg._id === data._id)) {
            return page;
          }

          return page.map((msg) => (msg._id === data._id ? data : msg));
        });

        return { ...old, pages: newPages };
      },
    );
  };

  private handleTypingStart = (data: MessageOutputTyping) => {
    if (
      !this.isMountedRef.current ||
      this.currentRoomIdRef.current !== this.roomId ||
      data.user._id === this.currentUserId
    ) {
      return;
    }

    this.setTypingUsers((prev) => new Map(prev).set(data.user._id, data));
  };

  private handleTypingEnd = (data: MessageOutputTyping) => {
    if (
      !this.isMountedRef.current ||
      this.currentRoomIdRef.current !== this.roomId
    ) {
      return;
    }

    this.setTypingUsers((prev) => {
      const newMap = new Map(prev);
      newMap.delete(data.user._id);
      return newMap;
    });
  };
}
