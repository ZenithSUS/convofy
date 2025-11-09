import { getUserToken } from "@/lib/utils";
import userService from "@/services/mongodb/user.service";
import messageFetchLimit from "@/lib/redis/redis-message-fetch-limit";
import { Redis } from "@upstash/redis";
import { Types } from "mongoose";
import { NextRequest, NextResponse } from "next/server";

const redis = Redis.fromEnv();

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

    const userId = token.sub;
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 },
      );
    }

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 },
      );
    }

    if (userId !== id) {
      return NextResponse.json(
        { error: "Forbidden: You can only view your own statistics" },
        { status: 403 },
      );
    }

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

    const cacheKey = `user-stats:${id}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return NextResponse.json(cached, {
        status: 200,
        headers: {
          "X-Cache": "HIT",
          "X-RateLimit-Remaining": remaining.toString(),
        },
      });
    }

    const response = await userService.getUserDataStats(id);
    await redis.setex(cacheKey, 300, JSON.stringify(response));

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "X-Cache": "MISS",
        "X-RateLimit-Remaining": remaining.toString(),
      },
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);

    return NextResponse.json(
      { error: "Failed to fetch user statistics" },
      { status: 500 },
    );
  }
};
