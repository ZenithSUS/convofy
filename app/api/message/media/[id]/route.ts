import { getMessagesByUserAndFileType } from "@/services/mongodb/message.service";
import { getUserToken } from "@/lib/utils";
import messageFetchLimit from "@/lib/redis/redis-message-fetch-limit";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    // Authentication
    const token = await getUserToken(req);

    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requestingUserId = new ObjectId(token.sub);
    const targetUserId = (await params).id;

    // Validate user ID format
    if (!targetUserId || !ObjectId.isValid(targetUserId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Rate limiting
    const {
      success,
      limit: rateLimit,
      remaining,
      reset,
    } = await messageFetchLimit.limit(requestingUserId.toString());

    if (!success) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
            "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        },
      );
    }

    if (requestingUserId.toString() !== targetUserId) {
      return NextResponse.json(
        { error: "Forbidden: You can only view your own media" },
        { status: 403 },
      );
    }

    const url = new URL(req.url).searchParams;

    let limit = Number(url.get("limit")) || 50;
    let offset = Number(url.get("offset")) || 0;

    // Validate limit bounds
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100; // Max 100 files per request

    // Validate offset
    if (offset < 0) offset = 0;

    const fileType = url.get("type"); // e.g., "image", "file"

    const response = await getMessagesByUserAndFileType(
      targetUserId,
      limit,
      offset,
      fileType || undefined,
    );

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Limit": limit.toString(),
        "X-Total-Count": response.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error fetching media:", error);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500 },
    );
  }
};
