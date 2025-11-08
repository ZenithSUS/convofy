import { getUserToken } from "@/lib/utils";
import userService from "@/services/mongodb/user.service";
import { UserLinkedAccount } from "@/types/user";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export const PATCH = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const token = await getUserToken(req);

    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: targetUserId } = await params;
    const loggedInUserId = new ObjectId(token.sub);
    const data = await req.json();

    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    if (targetUserId !== loggedInUserId.toString()) {
      return NextResponse.json(
        { error: "Forbidden: You can only link your own account" },
        { status: 403 },
      );
    }

    if (!targetUserId || !ObjectId.isValid(targetUserId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const { accountType }: { accountType: UserLinkedAccount } = data;

    if (!targetUserId || !accountType) {
      return NextResponse.json(
        { error: "Missing required fields: targetUserId, accountType" },
        { status: 400 },
      );
    }

    const response = await userService.unlinkAccount(targetUserId, accountType);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error unlinking user:", error);
    return NextResponse.json(
      { error: "Failed to unlink user" },
      { status: 500 },
    );
  }
};
