import { connectToDatabase } from "@/lib/mongodb";
import { getUserToken } from "@/lib/utils";
import matchQueueService from "@/services/mongodb/match-queue.service";
import roomService from "@/services/mongodb/room.service";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  try {
    await connectToDatabase();
    const token = await getUserToken(req);

    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = token.sub;

    if (token.role !== "anonymous" && token.isAnonymous !== true) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { roomId } = await req.json();

    if (!roomId) {
      return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
    }

    const room = await roomService.findRoomById(roomId);

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    await matchQueueService.leaveRoom(room, userId);

    return NextResponse.json(
      { success: true, message: "Room left successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("[LEAVE MATCH ERROR]", error);
    return NextResponse.json(
      { error: "Failed to leave match" },
      { status: 500 },
    );
  }
};
