import { connectToDatabase } from "@/lib/mongodb";
import roomService from "@/services/mongodb/room.service";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  try {
    const authHeader = req.headers.get("authorization");
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (authHeader !== expectedAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const deletedCount = await roomService.deleteAnonymousRooms();
    return NextResponse.json({
      success: true,
      deletedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[CRON] Anonymous room cleanup failed:", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
};

export const GET = async () => {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
};

export const PATCH = async () => {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
};

export const DELETE = async () => {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
};

export const HEAD = async () => {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
};

export const OPTIONS = async () => {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
};
