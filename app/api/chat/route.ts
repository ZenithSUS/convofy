import { sendLiveMessage } from "@/services/chat.service";
import { Message } from "@/types/message";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
  try {
    const data: Message = await req.json();

    // Validate required fields
    if (!data.room || !data.sender || !data.content) {
      return NextResponse.json(
        { error: "Missing required fields: room, sender, or content" },
        { status: 400 },
      );
    }

    console.log("Room ID:", data.room);
    const response = await sendLiveMessage(data);

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Failed to send live message:", error);

    return NextResponse.json(
      { error: "Failed to send live message" },
      { status: 500 },
    );
  }
};
