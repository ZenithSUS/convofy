import userService from "@/services/mongodb/user.service";
import { UserLinkedAccount } from "@/types/user";
import { NextResponse } from "next/server";

export const PATCH = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const data = await req.json();
    const { id } = await params;

    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const { accountType }: { accountType: UserLinkedAccount } = data;

    if (!id || !accountType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const response = await userService.unlinkAccount(id, accountType);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error unlinking user:", error);
    return NextResponse.json(
      { error: "Failed to unlink user" },
      { status: 500 },
    );
  }
};
