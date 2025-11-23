import { connectToDatabase } from "@/lib/mongodb";
import { getUserToken } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
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
    const entry = await matchQueueService.checkMatchStatus(userId);

    return NextResponse.json(entry, { status: 200 });
  } catch (error) {
    console.error("[MATCH STATUS ERROR]", error);
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 },
    );
  }
}
