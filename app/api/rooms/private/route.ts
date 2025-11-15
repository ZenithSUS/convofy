import { getUserToken } from "@/lib/utils";
import roomService from "@/services/mongodb/room.service";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  try {
    const token = await getUserToken(req);

    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authUserId = token.sub;
    const { userA, userB } = await req.json();

    // Validate required fields
    if (!userA || !userB) {
      return NextResponse.json(
        { error: "Both userA and userB are required." },
        { status: 400 },
      );
    }

    // Ensure userA in the request matches the authenticated user
    if (userA !== authUserId) {
      return NextResponse.json(
        { error: "Access denied: userA must match the authenticated user." },
        { status: 403 },
      );
    }

    // Prevent users from creating room with themselves
    if (userA === userB) {
      return NextResponse.json(
        { error: "Cannot create a room with yourself." },
        { status: 400 },
      );
    }

    const response = await roomService.getOrCreatePrivateRoom(userA, userB);

    // Return the response with status information
    return NextResponse.json(
      {
        success: true,
        ...response,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error creating private room:", error);
    return NextResponse.json(
      { error: "Failed to get or create private room." },
      { status: 500 },
    );
  }
};
