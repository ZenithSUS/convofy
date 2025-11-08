import messageLimit from "@/lib/redis/redis-message-send-limit";
import { getUserToken } from "@/lib/utils";
import chatService from "@/services/mongodb/chat.service";
import { Message, Sender } from "@/types/message";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export const POST = async (req: NextRequest) => {
  try {
    const token = await getUserToken(req);

    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = new ObjectId(token.sub);

    // Use user ID for rate limiting (more reliable than IP for authenticated users)
    const { success, limit, remaining, reset } = await messageLimit.limit(
      userId.toString(),
    );

    if (!success) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
            "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        },
      );
    }

    const data: Message = await req.json();

    // Validate required fields
    if (!data.room || !data.content || !data.sender) {
      return NextResponse.json(
        { error: "Missing required fields: room, sender or content" },
        { status: 400 },
      );
    }

    // Validate room ID format
    if (!ObjectId.isValid(data.room)) {
      return NextResponse.json({ error: "Invalid room ID" }, { status: 400 });
    }

    // Validate content length
    if (data.content.length > 10000) {
      return NextResponse.json({ error: "Message too long" }, { status: 400 });
    }

    if (typeof data.content !== "string") {
      return NextResponse.json(
        { error: "Content must be a string" },
        { status: 400 },
      );
    }

    // Override sender with authenticated user (prevent spoofing)
    data.sender = {
      ...data.sender,
      _id: userId,
    } as Sender;

    const room = await chatService.findRoomById(data.room);

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const isMember = room.members.some((m: ObjectId) => {
      const memberId = m._id ? m._id.toString() : m.toString();
      return memberId === userId.toString();
    });

    if (!isMember) {
      return NextResponse.json(
        { error: "Access denied: not part of this room" },
        { status: 403 },
      );
    }

    const response = await chatService.sendLiveMessage(data);

    return NextResponse.json(response, {
      status: 201,
      headers: {
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Limit": limit.toString(),
      },
    });
  } catch (error) {
    console.error("Failed to send live message:", error);
    return NextResponse.json(
      { error: "Failed to send live message" },
      { status: 500 },
    );
  }
};
