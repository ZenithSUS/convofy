import { getUserToken } from "@/lib/utils";
import roomService from "@/services/mongodb/room.service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Authenticate the user
    const token = await getUserToken(req);

    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId, userId } = await req.json();

    if (!roomId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: roomId or userId" },
        { status: 400 },
      );
    }

    // Ensure the authenticated user matches the joining user
    if (token.sub !== userId) {
      return NextResponse.json(
        { error: "Access denied: you can only join rooms as yourself." },
        { status: 403 },
      );
    }

    const room = await roomService.findRoomById(roomId);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const response = await roomService.addMemberToRoom(roomId, userId);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error joining room:", error);
    return NextResponse.json({ error: "Failed to join room" }, { status: 500 });
  }
}

export const GET = async () => {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
};

export const DELETE = async () => {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
};

export const PATCH = async () => {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
};
