import userService from "@/services/mongodb/user.service";
import { NextResponse, NextRequest } from "next/server";
import { getUserToken } from "@/lib/utils";

export const GET = async (
  req: NextRequest,
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

    const token = await getUserToken(req);
    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSelf = token.sub === id;
    const isAdmin = token.role === "admin" || token.isAdmin;

    if (!isSelf && !isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: You are not allowed to access this resource" },
        { status: 403 },
      );
    }

    // Fetch the user message stats
    const response = await userService.getUserMessageStats(id);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching user message stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch user message stats" },
      { status: 500 },
    );
  }
};
