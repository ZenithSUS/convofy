import roomService from "@/services/mongodb/room.service";
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

export const DELETE = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;
    const data = await req.json();

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 },
      );
    }

    const { userId } = data;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "Missing required field: userId" },
        { status: 400 },
      );
    }

    const room = await roomService.deleteRoomById(userId, id);

    return NextResponse.json(room, { status: 200 });
  } catch (error) {
    console.error("Error deleting room:", error);
    return NextResponse.json(
      { error: "Failed to delete room" },
      { status: 500 },
    );
  }
};
