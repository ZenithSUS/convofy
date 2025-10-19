import roomService from "@/services/room.service";
import { NextResponse } from "next/server";

export const GET = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;
    const room = await roomService.getRoomAndUsersById(id);

    return NextResponse.json(room, { status: 200 });
  } catch (error) {
    console.error("Error fetching room:", error);
    return NextResponse.json([], { status: 500 });
  }
};
