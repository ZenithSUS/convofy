import { pusherClient } from "@/lib/pusher/pusher-client";
import { PusherChannel, PusherEventMap } from "@/types/pusher";

let currentChannel: PusherChannel | null = null;

export const subscribeToUserStatus = (
  userId: string,
  callback: (data: PusherEventMap["status-update"]) => void,
) => {
  if (!userId) return;
  if (currentChannel) {
    return currentChannel;
  }

  const channelName = `user-${userId}`;
  currentChannel = pusherClient.subscribe(channelName);

  currentChannel.bind("status-update", callback);
  return currentChannel;
};

export const unsubscribeFromUserStatus = () => {
  if (!currentChannel) return;

  currentChannel.unbind_all();
  pusherClient.unsubscribe(currentChannel.name);
  currentChannel = null;
};
