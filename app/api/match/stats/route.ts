import { connectToDatabase } from "@/lib/mongodb";
import { getUserToken } from "@/lib/utils";
import matchQueueService from "@/services/mongodb/match-queue.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const token = await getUserToken(req);

    // Optional: Require admin role
    if (!token || token.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const stats = await matchQueueService.getQueueStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error("[MATCH STATS ERROR]", error);
    return NextResponse.json({ error: "Failed to get stats" }, { status: 500 });
  }
}
