import { getUserToken } from "@/lib/utils";
import userService from "@/services/mongodb/user.service";
import { CreateLinkedAccount } from "@/types/user";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export const POST = async (
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
    const data: Omit<CreateLinkedAccount, "id"> = await req.json();

    if (!data || typeof data !== "object") {
      return NextResponse.json("Unprocessable entity", { status: 422 });
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

    const response = await userService.linkedUserCredentials(
      targetUserId,
      data.credentials,
      data.linkedAccount,
    );

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json("Error creating user", { status: 500 });
  }
};
