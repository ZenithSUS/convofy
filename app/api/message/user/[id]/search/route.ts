import { getMessagesByUserIdAndQuery } from "@/services/mongodb/message.service";
import messageFetchLimit from "@/lib/redis/redis-message-fetch-limit";
import { getUserToken } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { escapeRegex } from "@/helper/escape-regex";

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    //  Authentication
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
        { error: "Forbidden: You can only search your own messages" },
        { status: 403 },
      );
    }

    // Parse and validate query parameters
    const url = new URL(req.url).searchParams;
    const query = url.get("query")?.trim() || "";

    if (!query) {
      return NextResponse.json(
        { error: "Missing required field: query" },
        { status: 400 },
      );
    }

    if (query.length > 200) {
      return NextResponse.json(
        { error: "Search query too long (max 200 characters)" },
        { status: 400 },
      );
    }

    // Sanitize query to prevent NoSQL injection
    const sanitizedQuery = escapeRegex(query);

    // Validate and bound pagination
    let limit = Number(url.get("limit")) || 20;
    let offset = Number(url.get("offset")) || 0;

    if (isNaN(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100; // Cap at 100 results
    if (isNaN(offset) || offset < 0) offset = 0;

    // Perform search
    const response = await getMessagesByUserIdAndQuery(
      targetUserId,
      sanitizedQuery,
      limit,
      offset,
    );

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "X-RateLimit-Remaining": remaining.toString(),
        "X-Total-Count": response.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 },
    );
  }
};
