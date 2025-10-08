import { getRoomsByUserId } from "@/services/room.service";

import { NextResponse } from "next/server";

export const GET = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const url = new URL(req.url);
    const userId = (await params).id;
    const queryParam = url.searchParams.get("query");

    if (!userId) {
      throw new Error("User id is required");
    }

    const rooms = await getRoomsByUserId(userId, queryParam || "");

    if (!rooms) {
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(rooms, { status: 200 });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json([], { status: 500 });
  }
};
