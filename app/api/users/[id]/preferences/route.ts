import { getUserToken } from "@/lib/utils";
import userService from "@/services/mongodb/user.service";
import { User } from "@/types/user";
import { NextRequest, NextResponse } from "next/server";

export const PUT = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const token = await getUserToken(req);

    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = token.sub;
    const { id } = await params;

    if (id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data: Partial<Pick<User, "preferences">> & {
      isAnonymous: boolean;
      role: "user" | "anonymous" | "admin";
    } = await req.json();

    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "Bad Request" }, { status: 400 });
    }

    const { isAnonymous, preferences, role } = data;

    if (!preferences) {
      return NextResponse.json({ error: "Bad Request" }, { status: 400 });
    }

    const response = await userService.updateUserPreferences(
      userId,
      role,
      isAnonymous,
      preferences,
    );

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error updating preferences:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
};
