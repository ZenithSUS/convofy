import userService from "@/services/mongodb/user.service";
import { User } from "@/types/user";
import { NextRequest, NextResponse } from "next/server";
import { getUserToken } from "@/lib/utils";

export const PUT = async (req: NextRequest) => {
  try {
    // Authenticate
    const token = await getUserToken(req);
    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = token.sub;

    // Parse and validate request body
    const data: Partial<User> = await req.json();
    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Prevent users from updating someone else’s data
    if (data._id && data._id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Force the update to be tied to the authenticated user
    const response = await userService.updateUser({
      ...data,
      _id: userId,
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
};

export const GET = async () => {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
};
