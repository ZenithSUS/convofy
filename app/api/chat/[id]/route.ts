import chatService from "@/services/mongodb/chat.service";
import { NextRequest, NextResponse } from "next/server";
import { getUserToken } from "@/lib/utils";
import { ObjectId } from "mongodb";
import messageLimit from "@/lib/redis/redis-message-send-limit";

export const DELETE = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    // Authentication
    const token = await getUserToken(req);
    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = new ObjectId(token.sub);
    const messageId = (await params).id;

    // Validate message ID format
    if (!messageId || !ObjectId.isValid(messageId)) {
      return NextResponse.json(
        { error: "Invalid message ID" },
        { status: 400 },
      );
    }

    // Rate limiting
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

    // Get message and verify ownership
    const message = await chatService.findMessageById(messageId);

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Authorization - check if user owns the message
    const messageSenderId = message.sender._id
      ? message.sender._id.toString()
      : message.sender.toString();

    const messageRoom = message.room.toString();

    if (messageSenderId !== userId.toString()) {
      return NextResponse.json(
        { error: "Forbidden: You can only delete your own messages" },
        { status: 403 },
      );
    }

    // Verify user is still in the room
    const room = await chatService.findRoomById(messageRoom);

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

    // Delete the message
    const response = await chatService.deleteLiveMessage(messageId);

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
      },
    });
  } catch (error) {
    console.error("Failed to delete live message:", error);
    return NextResponse.json(
      { error: "Failed to delete live message" },
      { status: 500 },
    );
  }
};

export const PUT = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const token = await getUserToken(req);
    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = new ObjectId(token.sub);
    const messageId = (await params).id;
    const { content } = await req.json();

    if (!messageId || !ObjectId.isValid(messageId)) {
      return NextResponse.json(
        { error: "Invalid message ID" },
        { status: 400 },
      );
    }

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Missing required field: content" },
        { status: 400 },
      );
    }

    if (content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content cannot be empty" },
        { status: 400 },
      );
    }

    if (content.length > 10000) {
      return NextResponse.json(
        { error: "Message too long (max 10000 characters)" },
        { status: 400 },
      );
    }

    // Rate limiting
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

    // Get message and verify ownership
    const message = await chatService.findMessageById(messageId);

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Authorization - check if user owns the message
    const messageSenderId = message.sender._id
      ? message.sender._id.toString()
      : message.sender.toString();

    const messageRoom = message.room.toString();

    if (messageSenderId !== userId.toString()) {
      return NextResponse.json(
        { error: "Forbidden: You can only edit your own messages" },
        { status: 403 },
      );
    }

    // Verify user is still in the room
    const room = await chatService.findRoomById(messageRoom);
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

    // Edit the message
    const response = await chatService.editLiveMessage(messageId, content);

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "X-RateLimit-Reset": reset.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
      },
    });
  } catch (error) {
    console.error("Failed to edit live message:", error);
    return NextResponse.json(
      { error: "Failed to edit live message" },
      { status: 500 },
    );
  }
};
