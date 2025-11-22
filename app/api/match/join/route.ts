import { NextRequest, NextResponse } from "next/server";
import MatchQueue from "@/models/MatchQueue";
import { getUserToken } from "@/lib/utils";
import matchQueueService from "@/services/mongodb/match-queue.service";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const token = await getUserToken(req);

    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Restrict to anonymous users
    if (token.role !== "anonymous" && token.isAnonymous !== true) {
      return NextResponse.json(
        { error: "Only anonymous users can use matchmaking" },
        { status: 403 },
      );
    }

    const body = await req.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const { userId, preferences } = body;

    if (userId !== token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Normalize preferences (schema uses object)
    const normalizedPreferences =
      typeof preferences === "object" && !Array.isArray(preferences)
        ? preferences
        : {
            interests: Array.isArray(preferences) ? preferences : [],
            language: undefined,
          };

    // Remove stale / duplicate queue entries
    await MatchQueue.deleteMany({
      userId,
    });

    // Create fresh queue entry
    const userEntry = await matchQueueService.createMatchQueue(userId, {
      preferences: normalizedPreferences,
    });

    // Try immediate match
    const matched = await matchQueueService.tryMatchNow({
      userId: userEntry.userId.toString(),
      _id: userEntry._id.toString(),
      preferences: normalizedPreferences,
    });

    if (matched) {
      return NextResponse.json({
        success: true,
        matched: true,
        roomId: matched.roomId.toString(),
        partnerId: matched.partner.toString(),
        message: "Match found immediately!",
      });
    }

    return NextResponse.json({
      success: true,
      matched: false,
      searching: true,
      message: "Searching for match...",
    });
  } catch (error) {
    console.error("[MATCH JOIN ERROR]", error);
    return NextResponse.json(
      { error: "Failed to join match queue" },
      { status: 500 },
    );
  }
}
