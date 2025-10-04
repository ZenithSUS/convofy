import { createMessage } from "@/services/message.service";
import { NextResponse } from "next/server";
import { Message } from "react-hook-form";

export const POST = async (req: Request) => {
  try {
    const data: Message = await req.json();

    if (!data || typeof data !== "object") {
      return new Response("Unprocessable entity", { status: 422 });
    }

    const response = await createMessage(data);
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Failed to send message" });
  }
};
