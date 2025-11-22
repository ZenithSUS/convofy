import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import matchQueueService from "@/services/mongodb/match-queue.service";

export const GET = async () => {
  await connectToDatabase();

  const removed = await matchQueueService.cleanHeartbeatStaleUsers();

  return NextResponse.json({
    success: true,
    removed,
  });
};
