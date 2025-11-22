import { connectToDatabase } from "@/lib/mongodb";
import { getUserToken } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import MatchQueue from "@/models/MatchQueue";
import matchQueueService from "@/services/mongodb/match-queue.service";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const token = await getUserToken(req);

    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = token.sub;

    // Get current queue entry
    const entry = await matchQueueService.getMatchQueue(userId);

    // If nothing exists → TTL removed entry or user never queued
    if (!entry) {
      return NextResponse.json({
        status: "not_found",
        matched: false,
      });
    }

    // Auto-fix stale matching lock (client crashed, browser closed, etc.)
    if (
      entry.status === "matching" &&
      entry.lockedAt &&
      entry.lockedAt < new Date(Date.now() - 5000)
    ) {
      // Unlock user safely
      await MatchQueue.updateOne(
        { userId },
        { $set: { status: "searching", lockedAt: null } },
      );

      return NextResponse.json({
        status: "searching",
        matched: false,
        reset: true,
      });
    }

    // Check for successful match
    if (entry.status === "matched" && entry.roomId) {
      return NextResponse.json({
        status: "matched",
        matched: true,
        roomId: entry.roomId,
        partnerId: entry.matchedWith,
      });
    }

    // Cancelled
    if (entry.status === "cancelled") {
      return NextResponse.json({
        status: "cancelled",
        matched: false,
      });
    }

    // Still searching
    return NextResponse.json({
      status: "searching",
      matched: false,
    });
  } catch (error) {
    console.error("[MATCH STATUS ERROR]", error);
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 },
    );
  }
}
