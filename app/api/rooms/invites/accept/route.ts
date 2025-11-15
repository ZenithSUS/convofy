import { getUserToken } from "@/lib/utils";
import roomService from "@/services/mongodb/room.service";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  try {
    const token = await getUserToken(req);

    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const authUser = token.sub;

    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const { roomId, userId } = data;

    if (!roomId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (userId !== authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const room = roomService.findRoomById(roomId);

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    await roomService.acceptRoomInvite(roomId, userId);

    return NextResponse.json({ message: "Invite accepted" }, { status: 200 });
  } catch (error) {
    console.error("Error accepting invite:", error);
    return NextResponse.json(
      { error: "Failed to accept invite" },
      { status: 500 },
    );
  }
};
