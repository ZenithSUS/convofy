import { pusherClient } from "@/lib/pusher-client";
import { PusherChannel, PusherEventMap } from "@/types/pusher";

let currentChannel: PusherChannel | null = null;

export const subscribeToUserStatus = (
  userId: string,
  callback: (data: PusherEventMap["status-update"]) => void,
) => {
  if (!userId) return;
  if (currentChannel) {
    console.log("Already subscribed to", currentChannel.name);
    return currentChannel;
  }

  const channelName = `user-${userId}`;
  currentChannel = pusherClient.subscribe(channelName);

  currentChannel.bind("status-update", callback);
  console.log("✅ Subscribed to", channelName);
  return currentChannel;
};

export const unsubscribeFromUserStatus = () => {
  if (!currentChannel) return;
  console.log("🧹 Unsubscribing from", currentChannel.name);

  currentChannel.unbind_all();
  pusherClient.unsubscribe(currentChannel.name);
  currentChannel = null;
};
