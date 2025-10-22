import userService from "@/services/mongodb/user.service";
import { NextResponse } from "next/server";

export const PUT = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;
    const { status } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 },
      );
    }

    const response = await userService.updateUserStatus(id, status);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Failed to update user status:", error);
    return NextResponse.json(
      { error: "Failed to update user status" },
      { status: 500 },
    );
  }
};
