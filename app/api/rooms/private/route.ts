import roomService from "@/services/mongodb/room.service";
import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
  try {
    const { userA, userB } = await request.json();

    if (!userA || !userB) {
      return NextResponse.json(
        { error: "Both userA and userB are required." },
        { status: 400 },
      );
    }

    const response = await roomService.getOrCreatePrivateRoom(userA, userB);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error in creating private room:", error);
    return NextResponse.json(
      { error: "Failed to get or create private room." },
      { status: 500 },
    );
  }
};
