import roomService from "@/services/mongodb/room.service";

import { NextResponse } from "next/server";

export const GET = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const userId = (await params).id;

    if (!userId && typeof userId !== "string") {
      throw new Error("User id is required");
    }

    const rooms = await roomService.getRoomsAndUsersByUserId(userId);

    if (!rooms) {
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(rooms, { status: 200 });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json([], { status: 500 });
  }
};
