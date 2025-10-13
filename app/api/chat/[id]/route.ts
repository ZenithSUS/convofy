import { deleteLiveMessage, editLiveMessage } from "@/services/chat.service";
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

export const PUT = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const messageId = (await params).id;
  const { content } = await req.json();

  if (!messageId || !content) {
    return NextResponse.json(
      { error: "Missing required fields: messageId or content" },
      { status: 400 },
    );
  }

  try {
    const response = await editLiveMessage(messageId, content);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Failed to edit live message:", error);
    return NextResponse.json(
      { error: "Failed to edit live message" },
      { status: 500 },
    );
  }
};
