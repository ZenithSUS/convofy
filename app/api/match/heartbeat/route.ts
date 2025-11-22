import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getUserToken } from "@/lib/utils";
import matchQueueService from "@/services/mongodb/match-queue.service";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const token = await getUserToken(req);

    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = token.sub;

    const updated = await matchQueueService.updateLastHeartbeat(userId);

    if (!updated) {
      return NextResponse.json(
        {
          status: "not_found",
          message: "User is not in match queue",
        },
        { status: 200 },
      );
    }

    return NextResponse.json({
      success: true,
      status: updated.status,
    });
  } catch (error) {
    console.error("[HEARTBEAT ERROR]", error);
    return NextResponse.json(
      { error: "Failed to update heartbeat" },
      { status: 500 },
    );
  }
}
