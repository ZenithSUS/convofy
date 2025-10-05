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

export const pusherClient = new Pusher(pusherKey!, {
  cluster: pusherCluster!,
  forceTLS: true, // Use forceTLS instead of the default
  enabledTransports: ["ws", "wss"], // Specify transports explicitly
});

// Add connection state logging
pusherClient.connection.bind("error", (err: any) => {
  console.error("Pusher connection error:", err);
});

pusherClient.connection.bind("connected", () => {
  console.log("Pusher connected successfully");
});
