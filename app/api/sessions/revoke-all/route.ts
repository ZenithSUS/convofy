import { authOptions } from "@/lib/auth";
import userService from "@/services/mongodb/user.service";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
  try {
    const session = await getServerSession(authOptions).catch(() => null);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { exceptCurrent } = await req.json();

    if (typeof exceptCurrent !== "boolean") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const currentSessionId = exceptCurrent ? session.user.sessionId : undefined;

    const response = await userService.revokeAllSessions(
      session.user.id,
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
