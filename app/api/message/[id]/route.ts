import { getMessagesByRoom, deleteMessage } from "@/services/message.service";

import { NextResponse } from "next/server";

export const GET = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const url = new URL(req.url).searchParams;
    const roomId = (await params).id;

    const limit = Number(url.get("limit")) || 5;
    const offset = Number(url.get("offset")) || 0;

    const messages = await getMessagesByRoom(roomId, limit, offset);
    return NextResponse.json(messages, { status: 200 });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json([], { status: 500 });
  }
};

export const DELETE = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const messageId = (await params).id;
    const deletedMessage = await deleteMessage(messageId);
    if (!deletedMessage) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Message deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 },
    );
  }
};
