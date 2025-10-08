import { pusherServer } from "@/lib/pusher";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
  try {
    const { roomId, user, isTyping } = await req.json();

    if (!roomId || !user || typeof isTyping !== "boolean") {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Check if roomId, user, and isTyping are defined
    await pusherServer.trigger(
      `chat-${roomId}`,
      isTyping ? "typing-start" : "typing-end",
      { user },
    );

    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (error) {
    console.error("Error updating typing status:", error);
    return NextResponse.json({ error: "Failed to update typing status" });
  }
};
