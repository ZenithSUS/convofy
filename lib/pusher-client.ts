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
  forceTLS: true,
  enabledTransports: ["ws", "wss"],
});

// // Handle connection states
// pusherClient.connection.bind("connected", () => {
//   console.log("Pusher connected successfully");
// });

// pusherClient.connection.bind("disconnected", () => {
//   console.log("Pusher disconnected, attempting to reconnect...");
//   // Pusher automatically attempts reconnection, but we can log it
// });

// pusherClient.connection.bind("error", (err: any) => {
//   console.error("Pusher connection error:", err);
//   // Pusher will automatically retry connection on errors
// });

// pusherClient.connection.bind("connecting", () => {
//   console.log("Pusher connecting...");
// });
