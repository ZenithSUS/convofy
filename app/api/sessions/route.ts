import { authOptions } from "@/lib/auth";
import userService from "@/services/mongodb/user.service";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const GET = async () => {
  try {
    const session = await getServerSession(authOptions).catch(() => null);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Row-level security: only fetch sessions for the logged-in user
    const userId = session.user.id;

    // 3️Fetch active sessions
    const response = await userService.getUserActiveSessions(userId);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error getting session:", error);
    return NextResponse.json(
      { error: "Failed to get session" },
      { status: 500 },
    );
  }
};
