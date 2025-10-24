import userService from "@/services/mongodb/user.service";
import { NextResponse } from "next/server";

export const GET = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id }: { id: string } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 },
      );
    }

    const response = await userService.getUserMessageStats(id);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching user message stats:", error);
    return NextResponse.json(
      { error: `Failed to fetch user message stats: ${error}` },
      { status: 500 },
    );
  }
};
