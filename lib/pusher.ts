import Pusher from "pusher";

// Debug: Check environment variables on server startup
console.log("Pusher Server Config Check:", {
  appId: process.env.PUSHER_APP_ID ? "✓" : "✗ MISSING",
  key: process.env.PUSHER_KEY ? "✓" : "✗ MISSING",
  secret: process.env.PUSHER_SECRET ? "✓" : "✗ MISSING",
  cluster: process.env.PUSHER_CLUSTER || "✗ MISSING",
});

const appId = process.env.PUSHER_APP_ID;
const key = process.env.PUSHER_KEY;
const secret = process.env.PUSHER_SECRET;
const cluster = process.env.PUSHER_CLUSTER;

if (!appId || !key || !secret || !cluster) {
  throw new Error(
    `Missing Pusher environment variables: ${[
      !appId && "PUSHER_APP_ID",
      !key && "PUSHER_KEY",
      !secret && "PUSHER_SECRET",
      !cluster && "PUSHER_CLUSTER",
    ]
      .filter(Boolean)
      .join(", ")}`,
  );
}

export const pusherServer = new Pusher({
  appId: appId,
  key: key,
  secret: secret,
  cluster: cluster,
  useTLS: true,
});

console.log(`✓ Pusher Server initialized for cluster: ${cluster}`);
