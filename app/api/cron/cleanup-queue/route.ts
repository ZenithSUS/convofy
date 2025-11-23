import { NextResponse } from "next/server";
import matchQueueService from "@/services/mongodb/match-queue.service";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    // Verify the secret token
    const authHeader = request.headers.get("authorization");
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (authHeader !== expectedAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to database
    await connectToDatabase();

    // Run cleanup
    const deletedCount = await matchQueueService.cleanStaleQueue();

    return NextResponse.json({
      success: true,
      deletedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[CRON] Queue cleanup failed:", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
