import { getUserToken } from "@/lib/utils";
import { getMessagesByUserId } from "@/services/mongodb/message.service";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const token = await getUserToken(req);

    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = token.sub;
    const url = new URL(req.url).searchParams;
    const { id: targetUserId }: { id: string } = await params;

    if (userId !== targetUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let limit = Number(url.get("limit")) || 0;
    let offset = Number(url.get("offset")) || 0;

    if (limit > 100) limit = 100;
    if (offset < 0) offset = 0;

    if (!targetUserId || !ObjectId.isValid(targetUserId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const response = await getMessagesByUserId(targetUserId, limit, offset);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 },
    );
  }
};
