import { createRoom, getRooms } from "@/services/room.service";
import { CreateRoom } from "@/types/room";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const queryParam = url.searchParams.get("query");
  let rooms = await getRooms();

  if (queryParam) {
    rooms = rooms.filter((room) =>
      room.name.toLowerCase().includes(queryParam.toLowerCase()),
    );
  }

  if (!rooms) {
    return NextResponse.json([], {
      status: 200,
    });
  }

  return NextResponse.json(rooms, {
    status: 200,
  });
}

export async function POST(request: Request) {
  try {
    const data: CreateRoom = await request.json();
    const response = await createRoom(data);

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating room:", error);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 },
    );
  }
}
