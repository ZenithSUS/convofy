import { getMessagesByUserId } from "@/services/mongodb/message.service";
import { NextResponse } from "next/server";

export const GET = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const url = new URL(req.url).searchParams;
    const { id }: { id: string } = await params;

    const limit = Number(url.get("limit")) || 0;
    const offset = Number(url.get("offset")) || 0;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 },
      );
    }

    const response = await getMessagesByUserId(id, limit, offset);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 },
    );
  }
};
