import { pusherServer } from "@/lib/pusher/pusher-server";
import { getUserToken } from "@/lib/utils";
import typingRateLimit from "@/lib/redis/redis-typing-limit";
import roomService from "@/services/mongodb/room.service";
import userService from "@/services/mongodb/user.service";
import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import typingIndicatorName from "@/helper/typing-indicator-name";

export const POST = async (req: NextRequest) => {
  try {
    const token = await getUserToken(req);

    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = token.sub;

    // Validate user ID format
    if (!Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Parse request body
    const body = await req.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const { roomId, isTyping } = body;

    // Validate required fields
    if (!roomId || typeof roomId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid field: roomId" },
        { status: 400 },
      );
    }

    if (typeof isTyping !== "boolean") {
      return NextResponse.json(
        { error: "Missing or invalid field: isTyping" },
        { status: 400 },
      );
    }

    // Validate room ID format
    if (!Types.ObjectId.isValid(roomId)) {
      return NextResponse.json(
        { error: "Invalid room ID format" },
        { status: 400 },
      );
    }

    const rateLimitKey = `${userId}:${roomId}`;
    const { success, limit, remaining, reset } =
      await typingRateLimit.limit(rateLimitKey);

    if (!success) {
      return NextResponse.json(
        { error: "Too many typing updates" },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          },
        },
      );
    }

    // Verify room exists
    const room = await roomService.findRoomById(roomId);

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Authorization - check room membership
    const isMember = room.members.some((member) => {
      const memberId =
        typeof member === "string"
          ? member
          : member._id?.toString() || member.toString();
      return memberId === userId;
    });

    if (!isMember) {
      return NextResponse.json(
        { error: "Forbidden: You are not a member of this room" },
        { status: 403 },
      );
    }

    // Get authenticated user data from database
    const user = await userService.getUserById(userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Safe user data
    const safeUserData = {
      _id: user._id.toString(),
      name: typingIndicatorName(user),
      avatar: user.avatar || null,
    };

    // Trigger Pusher event
    await pusherServer.trigger(
      `presence-chat-${roomId}`,
      isTyping ? "typing-start" : "typing-end",
      { user: safeUserData },
    );

    return NextResponse.json(
      { success: true, user: safeUserData },
      {
        status: 200,
        headers: {
          "X-RateLimit-Remaining": remaining.toString(),
        },
      },
    );
  } catch (error) {
    console.error("Error updating typing status:", error);
    return NextResponse.json(
      { error: "Failed to update typing status" },
      { status: 500 },
    );
  }
};

export const GET = async () => {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
};
