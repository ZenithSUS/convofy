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

  return NextResponse.json(response, {
    status: 200,
  });
}
