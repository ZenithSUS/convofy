import { createMessage, getMessages } from "@/services/message.service";
import { NextResponse } from "next/server";
import { Message } from "react-hook-form";

export const POST = async (req: Request) => {
  try {
    const data: Message = await req.json();

    if (!data || typeof data !== "object") {
      return new Response("Unprocessable entity", { status: 422 });
    }

    const response = await createMessage(data);
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Failed to send message" });
  }
};

export const GET = async (req: Request) => {
  try {
    const url = new URL(req.url).searchParams;
    const roomId = url.get("roomId") || "";
    const limit = Number(url.get("limit")) || 5;
    const offset = Number(url.get("offset")) || 0;

    if (!roomId) {
      return NextResponse.json({ error: "Missing required field: roomId" });
    }

    const response = await getMessages(roomId, limit, offset);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" });
  }
};
