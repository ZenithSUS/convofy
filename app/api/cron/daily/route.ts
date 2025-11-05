import userService from "@/services/mongodb/user.service";
import { NextResponse } from "next/server";

export const GET = async () => {
  try {
    console.log("Running daily cron job...");

    // Cronjobs
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
