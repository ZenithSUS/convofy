import { getUserToken } from "@/lib/utils";
import userService from "@/services/mongodb/user.service";
import { NextRequest, NextResponse } from "next/server";

export const PATCH = async (req: NextRequest) => {
  try {
    const token = await getUserToken(req);

    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const userId = token.sub;

    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const { id: targetUserId, currentPassword, newPassword } = data;

    if (!targetUserId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (targetUserId !== userId) {
      return NextResponse.json(
        { error: "Forbidden: You can only change your own password" },
        { status: 403 },
      );
    }

    const response = await userService.changePassword(
      targetUserId,
      currentPassword,
      newPassword,
    );

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 },
    );
  }
};
