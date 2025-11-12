import userService from "@/services/mongodb/user.service";
import { NextResponse, NextRequest } from "next/server";
import { getUserToken } from "@/lib/utils";
import UserMessageCacheStats from "@/lib/cache/cache-message-user-stat";
import messageFetchLimit from "@/lib/redis/redis-message-fetch-limit";

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 },
      );
    }

    const token = await getUserToken(req);
    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSelf = token.sub === id;
    const isAdmin = token.role === "admin" || token.isAdmin;

    if (!isSelf && !isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: You are not allowed to access this resource" },
        { status: 403 },
      );
    }

    const { success, limit, remaining, reset } =
      await messageFetchLimit.limit(id);

    if (!success) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          },
        },
      );
    }

    const cached = UserMessageCacheStats.get(id);

    if (cached) {
      return NextResponse.json(cached, {
        status: 200,
        headers: {
          "X-Cache": "HIT",
          "X-RateLimit-Remaining": remaining.toString(),
        },
      });
    }

    // Fetch the user message stats
    const response = await userService.getUserMessageStats(id);

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "X-Cache": "MISS",
        "X-RateLimit-Remaining": remaining.toString(),
      },
    });
  } catch (error) {
    console.error("Error fetching user message stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch user message stats" },
      { status: 500 },
    );
  }
};
