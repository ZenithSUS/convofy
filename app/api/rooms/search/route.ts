import roomService from "@/services/mongodb/room.service";
import { getUserToken } from "@/lib/utils";
import messageFetchLimit from "@/lib/redis/redis-message-fetch-limit";
import { NextRequest, NextResponse } from "next/server";
import { escapeRegex } from "@/helper/escape-regex";

export const GET = async (req: NextRequest) => {
  try {
    // Authentication
    const token = await getUserToken(req);

    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = token.sub;

    const {
      success,
      limit: rateLimit,
      remaining,
      reset,
    } = await messageFetchLimit.limit(userId);

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

    // Parse and validate query parameter
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.trim() || "";

    // Validate search query
    if (!query) {
      return NextResponse.json([], { status: 200 });
    }

    if (query.length > 100) {
      return NextResponse.json(
        { error: "Search query too long (max 100 characters)" },
        { status: 400 },
      );
    }

    // Sanitize query to prevent NoSQL injection
    const sanitizedQuery = escapeRegex(query);

    const response = await roomService.getRoomsAndUsersBySearchQuery(
      userId,
      sanitizedQuery,
    );

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "X-RateLimit-Remaining": remaining.toString(),
        "X-Total-Count": response.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error searching rooms and users:", error);
    return NextResponse.json(
      { error: "Failed to search rooms and users" },
      { status: 500 },
    );
  }
};
