import { NextRequest, NextResponse } from "next/server";
import matchQueueService from "@/services/mongodb/match-queue.service";
import { getUserToken } from "@/lib/utils";
import { connectToDatabase } from "@/lib/mongodb";
import MatchQueue from "@/models/MatchQueue";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const token = await getUserToken(req);
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authUser = token.sub;

    const body = await req.json();
    const { userId } = body;

    // Validate token matches userId
    if (userId !== authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Reset queue entry instead of deleting it (consistent with new schema)
    await MatchQueue.findOneAndUpdate(
      { userId },
      {
        $set: {
          status: "cancelled",
          matchedWith: null,
          roomId: null,
          lockedAt: null,
        },
      },
      { new: true },
    );

    // Let the service handle any cleanup + pusher triggers
    await matchQueueService.cancelSearch(userId);

    return NextResponse.json(
      { success: true, message: "Match cancelled" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error cancelling match:", error);
    return NextResponse.json(
      { error: "Failed to cancel match" },
      { status: 500 },
    );
  }
}
