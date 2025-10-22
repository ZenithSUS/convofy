import { createMessage, getMessages } from "@/services/mongodb/message.service";
import { NextResponse } from "next/server";
import { CreateMessage } from "@/types/message";
import messageSendLimit from "@/lib/redis/redis-message-send-limit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const POST = async (req: Request) => {
  try {
    const data: CreateMessage = await req.json();
    const ip =
      data.sender.toString() ||
      req.headers.get("x-forwarded-for") ||
      "127.0.0.1";

    const { success, limit, remaining, reset } =
      await messageSendLimit.limit(ip);

    if (!success) {
      return new NextResponse("Too many requests", {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
        },
      });
    }

    if (!data || typeof data !== "object") {
      return NextResponse.json("Unprocessable entity", { status: 422 });
    }

    const response = await createMessage(data);
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Failed to send message" });
  }
};

export const GET = async (req: Request) => {
  try {
    const session = await getServerSession(authOptions);
    const ip =
      session?.user?.id ||
      req.headers.get("x-forwarded-for") ||
      "127.0.0.1" ||
      "localhost";

    const {
      success,
      limit: sendLimit,
      remaining,
      reset,
    } = await messageSendLimit.limit(ip);

    console.log(
      `IP: ${ip} - Rate Limit: ${sendLimit}, Remaining: ${remaining}, Reset: ${reset}`,
    );
    if (!success) {
      return new NextResponse("Too many requests", {
        status: 429,
        headers: {
          "X-RateLimit-Limit": sendLimit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
        },
      });
    }

    const url = new URL(req.url).searchParams;
    const roomId = url.get("roomId") || "";
    const limit = Number(url.get("limit")) || 5;
    const offset = Number(url.get("offset")) || 0;

    if (!roomId) {
      return NextResponse.json({ error: "Missing required field: roomId" });
    }

    const response = await getMessages(roomId, limit, offset);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" });
  }
};
