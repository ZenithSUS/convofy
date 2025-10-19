import roomService from "@/services/room.service";
import { NextResponse } from "next/server";

export const GET = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const userId = searchParams.get("userId");

    if (!query) {
      return NextResponse.json([], { status: 200 });
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    const response = await roomService.getRoomsAndUsersBySearchQuery(
      userId,
      query,
    );

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error searching rooms and users:", error);
    return NextResponse.json(
      { error: "Failed to search rooms and users" },
      { status: 500 },
    );
  }
};
