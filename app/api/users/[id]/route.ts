import userService from "@/services/mongodb/user.service";
import { NextResponse } from "next/server";

export const DELETE = async (
  req: Request,
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

    const response = await userService.deleteUserById(id);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error deleting User:", error);
    return NextResponse.json({ error: "Error deleting User" }, { status: 500 });
  }
};
