import { Rooms } from "@/data/rooms";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const queryParam = url.searchParams.get("query");
  let response = Rooms;

  if (queryParam) {
    response = Rooms.filter((room) =>
      room.name.toLowerCase().includes(queryParam.toLowerCase()),
    );
  }

  if (response.length === 0) {
    return NextResponse.json([], {
      status: 200,
    });
  }

  return NextResponse.json(response, {
    status: 200,
  });
}
