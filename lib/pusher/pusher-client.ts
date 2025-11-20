import Pusher from "pusher-js";

// Validate environment variables
const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

if (!pusherKey || !pusherCluster) {
  console.error("Pusher credentials missing:", {
    key: pusherKey ? "✓" : "✗",
    cluster: pusherCluster ? "✓" : "✗",
  });
}

let pusherInstance: Pusher | null = null;

export const getPusherClient = () => {
  if (typeof window === "undefined") {
    return null;
  }

  if (!pusherInstance) {
    pusherInstance = new Pusher(pusherKey!, {
      cluster: pusherCluster!,
      authEndpoint: "/api/pusher/auth",
      enabledTransports: ["ws", "wss"],
      forceTLS: true,
    });
  }

  return pusherInstance;
};

export const pusherClient = getPusherClient()!;

// Force reconnect function
export const reconnectPusher = () => {
  if (pusherInstance) {
    pusherInstance.disconnect();
    pusherInstance.connect();
  }
};
