import { authOptions } from "@/lib/auth";
import userService from "@/services/mongodb/user.service";
import { getServerSession } from "next-auth";
import { NextResponse, NextRequest } from "next/server";

export const POST = async (req: NextRequest) => {
  try {
    // Authenticate via NextAuth
    const session = await getServerSession(authOptions).catch(() => null);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { exceptCurrent, targetUserId } = await req.json();

    if (typeof exceptCurrent !== "boolean") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const isAdmin = session.user.role === "admin";

    // Users can only revoke their own sessions
    // Admins can revoke any user’s sessions (with targetUserId)
    const userIdToRevoke =
      isAdmin && targetUserId ? targetUserId : session.user.id;

    if (!isAdmin && targetUserId && targetUserId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only revoke your own sessions" },
        { status: 403 },
      );
    }

    const currentSessionId = exceptCurrent ? session.user.sessionId : undefined;
    const response = await userService.revokeAllSessions(
      userIdToRevoke,
      currentSessionId,
    );

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error revoking session:", error);
    return NextResponse.json(
      { error: "Failed to revoke session" },
      { status: 500 },
    );
  }
};

export const GET = async () => {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
};
