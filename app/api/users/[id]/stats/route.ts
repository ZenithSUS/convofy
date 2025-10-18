import userService from "@/services/user.service";
import { NextResponse } from "next/server";

export const GET = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const id = (await params).id;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 },
      );
    }

    const response = await userService.getUserDataStats(id);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: `Failed to fetch user stats: ${error}` },
      { status: 500 },
    );
  }
};
