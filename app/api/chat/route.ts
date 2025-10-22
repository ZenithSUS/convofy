import messageLimit from "@/lib/redis/redis-message-send-limit";
import chatService from "@/services/mongodb/chat.service";
import { Message } from "@/types/message";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
  try {
    const data: Message = await req.json();
    const ip =
      data.sender.toString() ||
      req.headers.get("x-forwarded-for") ||
      "127.0.0.1";

    const { success, limit, remaining, reset } = await messageLimit.limit(ip);

    if (!success) {
      return new NextResponse("Too many requests", {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
        },
      });
    }

    // Validate required fields
    if (!data.room || !data.sender || !data.content) {
      return NextResponse.json(
        { error: "Missing required fields: room, sender, or content" },
        { status: 400 },
      );
    }

    const response = await chatService.sendLiveMessage(data);

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Failed to send live message:", error);

    return NextResponse.json(
      { error: "Failed to send live message" },
      { status: 500 },
    );
  }
};
