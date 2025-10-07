import { deleteLiveMessage } from "@/services/chat.service";
import { NextResponse } from "next/server";

export const DELETE = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const messageId = (await params).id;

  if (!messageId) {
    return NextResponse.json(
      { error: "Missing required fields: messageId" },
      { status: 400 },
    );
  }

  try {
    const response = await deleteLiveMessage(messageId);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Failed to delete live message:", error);

    return NextResponse.json(
      { error: "Failed to delete live message" },
      { status: 500 },
    );
  }
};
