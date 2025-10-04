import { getRoomById } from "@/services/room.service";
import { NextResponse } from "next/server";

export const GET = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const slug = (await params).id;
    const room = await getRoomById(slug);

    return NextResponse.json(room, { status: 200 });
  } catch (error) {
    console.error("Error fetching room:", error);
    return NextResponse.json([], { status: 500 });
  }
};
