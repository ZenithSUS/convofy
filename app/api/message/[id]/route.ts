import messageFetchLimit from "@/lib/redis/redis-message-fetch-limit";
import { getUserToken } from "@/lib/utils";
import {
  getMessagesByRoom,
  deleteMessage,
  findMessageById,
} from "@/services/mongodb/message.service";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import roomService from "@/services/mongodb/room.service";

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    // Authenticate
    const token = await getUserToken(req);

    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = new ObjectId(token.sub);
    const roomId = (await params).id;

    // Check if the roomId is valid
    if (!roomId || !ObjectId.isValid(roomId)) {
      return NextResponse.json({ error: "Invalid room ID" }, { status: 400 });
    }

    const {
      success,
      limit: sendLimit,
      remaining,
      reset,
    } = await messageFetchLimit.limit(userId.toString());

    if (!success) {
      return new NextResponse("Too many requests", {
        status: 429,
        headers: {
          "X-RateLimit-Limit": sendLimit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
        },
      });
    }

    const room = await roomService.findRoomById(roomId);

    // Check if the room exists
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const isMember = room.members.some((m: ObjectId) => {
      const memberId = m._id ? m._id.toString() : m.toString();
      return memberId === userId.toString();
    });

    // Check if the user is a member of the room
    if (!isMember) {
      return NextResponse.json(
        { error: "Forbidden: You are not a member of this room" },
        { status: 403 },
      );
    }

    const url = new URL(req.url).searchParams;
    let limit = Number(url.get("limit")) || 5;
    let offset = Number(url.get("offset")) || 0;

    // Set limit to a minimum of 1 and a maximum of 100
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100;

    // Set offset to a minimum of 0
    if (offset < 0) offset = 0;

    // Fetch messages
    const messages = await getMessagesByRoom(
      userId.toString(),
      roomId,
      limit,
      offset,
    );

    return NextResponse.json(messages, {
      status: 200,
      headers: {
        "X-RateLimit-Limit": sendLimit.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
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

export const DELETE = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const token = await getUserToken(req);
    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const messageId = (await params).id;
    const userId = new ObjectId(token.sub);

    if (!messageId || !ObjectId.isValid(messageId)) {
      return NextResponse.json(
        { error: "Invalid message ID" },
        { status: 400 },
      );
    }

    const message = await findMessageById(messageId);

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const messageSenderId = message.sender._id
      ? message.sender._id.toString()
      : message.sender.toString();

    const messageRoom = message.room.toString();

    if (messageSenderId !== userId.toString()) {
      return NextResponse.json(
        { error: "Forbidden: You are not the sender of this message" },
        { status: 403 },
      );
    }

    const room = await roomService.findRoomById(messageRoom);

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

    const response = await deleteMessage(messageId);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 },
    );
  }
};
