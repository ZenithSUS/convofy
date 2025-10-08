import { addMemberToRoom } from "@/services/room.service";
import { NextResponse } from "next/server";

class JoinRoutes {
  async POST(req: Request) {
    try {
      const { roomId, userId } = await req.json();

      console.log("Room ID:", roomId);
      console.log("User ID:", userId);

      if (!userId || !roomId) {
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 },
        );
      }

      const response = await addMemberToRoom(roomId, userId);

      return NextResponse.json(response, { status: 200 });
    } catch (error) {
      console.error("Error joining room:", error);
      return NextResponse.json(
        { error: "Failed to join room" },
        { status: 500 },
      );
    }
  }
}

export const { POST } = new JoinRoutes();
