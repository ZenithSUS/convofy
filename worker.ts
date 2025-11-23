import mongoose from "mongoose";
import matchQueueService from "./services/mongodb/match-queue.service";

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_DB_URI!);
    console.log("[Worker] Connected to MongoDB");
  } catch (error) {
    console.error("[Worker] Error connecting to MongoDB", error);
    process.exit(1);
  }
}

async function main() {
  await connectDB();

  matchQueueService.startCleanupLoop();
  console.log("[Worker] Cleanup loop started");

  process.on("SIGTERM", async () => {
    console.log("[Worker] SIGTERM signal received. Shutting down...");
    await mongoose.connection.close();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("[Worker] Error in main:", error);
  process.exit(1);
});
