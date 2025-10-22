import roomService from "@/services/mongodb/room.service";
import { CreateRoom } from "@/types/room";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const queryParam = url.searchParams.get("query");
    const rooms = await roomService.getRooms(queryParam || "");

    if (!rooms) {
      return NextResponse.json([], {
        status: 200,
      });
    }

    return NextResponse.json(rooms, {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data: CreateRoom = await request.json();
    const response = await roomService.createRoom(data);

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating room:", error);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 },
    );
  }
}
