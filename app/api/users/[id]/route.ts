import { getUserToken } from "@/lib/utils";
import userService from "@/services/mongodb/user.service";
import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import accountDeletionLimit from "@/lib/redis/redis-deletion-limit";

export const DELETE = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const token = await getUserToken(req);

    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = token.sub;

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
        { error: "Forbidden: You can only delete your own account" },
        { status: 403 },
      );
    }

    const { success, limit, remaining, reset } =
      await accountDeletionLimit.limit(userId);

    if (!success) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
            "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        },
      );
    }

    const response = await userService.deleteUserById(id);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error deleting User:", error);
    return NextResponse.json({ error: "Error deleting User" }, { status: 500 });
  }
};

export const GET = async () => {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
};
