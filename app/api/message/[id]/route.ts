import { getMessagesByRoom } from "@/services/message.service";
import { NextResponse } from "next/server";

export const GET = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const roomId = (await params).id;
    const messages = await getMessagesByRoom(roomId);
    return NextResponse.json(messages, { status: 200 });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json([], { status: 500 });
  }
};
