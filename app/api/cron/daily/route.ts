import userService from "@/services/mongodb/user.service";
import { NextRequest, NextResponse } from "next/server";
import "@/lib/mongodb";

export const GET = async (req: NextRequest) => {
  try {
    const authHeader = req.headers.get("authorization");
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (authHeader !== expectedAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Running daily cron job...");

    // Run the daily cron job
    await userService.cleanExpiredSessions();

    return NextResponse.json(
      { message: "Daily cron job run successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error running daily cron job:", error);
    return NextResponse.json(
      { error: "Failed to run daily cron job" },
      { status: 500 },
    );
  }
};
