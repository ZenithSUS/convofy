import { createMessage, getMessages } from "@/services/mongodb/message.service";
import chatService from "@/services/mongodb/chat.service";
import { NextRequest, NextResponse } from "next/server";
import { CreateMessage } from "@/types/message";
import messageSendLimit from "@/lib/redis/redis-message-send-limit";
import messageFetchLimit from "@/lib/redis/redis-message-fetch-limit";
import { getUserToken } from "@/lib/utils";
import { ObjectId } from "mongodb";
import UserStatsCache from "@/lib/cache/cache-user-stats";
import userService from "@/services/mongodb/user.service";
import UserMessageCacheStats from "@/lib/cache/cache-message-user-stat";

export const POST = async (req: NextRequest) => {
  try {
    // 1. Authentication
    const token = await getUserToken(req);

    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = new ObjectId(token.sub);

    // 2. Rate limiting - use user ID, NOT client data
    const { success, limit, remaining, reset } = await messageSendLimit.limit(
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

    // 3. Parse and validate request body
    const data: CreateMessage = await req.json();

    if (!data || typeof data !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    // 4. Validate required fields
    if (!data.room || !data.content) {
      return NextResponse.json(
        { error: "Missing required fields: room, content" },
        { status: 400 },
      );
    }

    // 5. Validate room ID format
    if (!ObjectId.isValid(data.room.toString())) {
      return NextResponse.json(
        { error: "Invalid room ID format" },
        { status: 400 },
      );
    }

    // 6. Validate content
    if (typeof data.content !== "string") {
      return NextResponse.json(
        { error: "Content must be a string" },
        { status: 400 },
      );
    }

    const trimmedContent = data.content.trim();

    if (trimmedContent.length === 0) {
      return NextResponse.json(
        { error: "Message content cannot be empty" },
        { status: 400 },
      );
    }

    if (trimmedContent.length > 10000) {
      return NextResponse.json(
        { error: "Message too long (max 10000 characters)" },
        { status: 400 },
      );
    }

    // Verify room exists and user is a member
    const room = await chatService.findRoomById(data.room.toString());

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const isMember = room.members.some((m: ObjectId) => {
      const memberId = m._id ? m._id.toString() : m.toString();
      return memberId === userId.toString();
    });

    if (!isMember) {
      return NextResponse.json(
        { error: "Forbidden: You are not a member of this room" },
        { status: 403 },
      );
    }

    // 8. Override sender with authenticated user (prevent spoofing)
    const messageData: CreateMessage = {
      ...data,
      content: trimmedContent,
      sender: userId.toString(), // Always use authenticated user ID
      room: data.room.toString(),
    };

    // 9. Create message
    const response = await createMessage(messageData);

    return NextResponse.json(response, {
      status: 201,
      headers: {
        "X-RateLimit-Remaining": remaining.toString(),
      },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 },
    );
  }
};

export const GET = async (req: NextRequest) => {
  try {
    // Authentication
    const token = await getUserToken(req);

    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = new ObjectId(token.sub);

    // 2. Rate limiting - use messageFetchLimit for GET requests
    const {
      success,
      limit: fetchLimit,
      remaining,
      reset,
    } = await messageFetchLimit.limit(userId.toString());

    if (!success) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": fetchLimit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
            "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        },
      );
    }

    // 3. Parse and validate query parameters
    const url = new URL(req.url).searchParams;
    const roomId = url.get("roomId");

    if (!roomId) {
      return NextResponse.json(
        { error: "Missing required field: roomId" },
        { status: 400 },
      );
    }

    // 4. Validate room ID format
    if (!ObjectId.isValid(roomId)) {
      return NextResponse.json(
        { error: "Invalid room ID format" },
        { status: 400 },
      );
    }

    // 5. Parse and validate pagination
    let limit = Number(url.get("limit")) || 50;
    let offset = Number(url.get("offset")) || 0;

    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100; // Cap at 100 messages
    if (offset < 0) offset = 0;

    // 6. Verify room exists and user is a member
    const room = await chatService.findRoomById(roomId);

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const isMember = room.members.some((m: ObjectId) => {
      const memberId = m._id ? m._id.toString() : m.toString();
      return memberId === userId.toString();
    });

    if (!isMember) {
      return NextResponse.json(
        { error: "Forbidden: You are not a member of this room" },
        { status: 403 },
      );
    }

    // Fetch messages
    const response = await getMessages(roomId, limit, offset);

    // Update user stats cache
    await Promise.all([
      UserStatsCache.refresh(userId.toString(), () =>
        userService.getUserDataStats(userId.toString()),
      ),
      UserMessageCacheStats.refresh(userId.toString(), () =>
        userService.getUserMessageStats(userId.toString()),
      ),
    ]);

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "X-RateLimit-Remaining": remaining.toString(),
        "X-Total-Count": response.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 },
    );
  }
};
