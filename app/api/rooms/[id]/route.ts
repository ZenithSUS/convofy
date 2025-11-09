import { getUserToken } from "@/lib/utils";
import roomService from "@/services/mongodb/room.service";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const token = await getUserToken(req);
    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const room = await roomService.getRoomAndUsersById(id);

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const isMember = room.members.some((m) => m._id.toString() === token.sub);

    if (!isMember) {
      return NextResponse.json(
        { error: "Access denied: you are not part of this room" },
        { status: 403 },
      );
    }

    return NextResponse.json(room, { status: 200 });
  } catch (error) {
    console.error("Error fetching room:", error);
    return NextResponse.json(
      { error: "Failed to fetch room" },
      { status: 500 },
    );
  }
};

export const DELETE = async (
  req: NextRequest,
  { params }: { params: { id: string } },
) => {
  try {
    const token = await getUserToken(req);
    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const { userId } = await req.json();

    if (!id || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: id or userId" },
        { status: 400 },
      );
    }

    // Allow deletion if:
    //  - the user is the owner of the room, OR
    //  - the user is an admin
    if (userId !== token.sub && token.role !== "admin") {
      return NextResponse.json(
        { error: "Access denied: cannot delete as another user" },
        { status: 403 },
      );
    }

    const room = await roomService.getRoomAndUsersById(id);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Allow deletion if:
    //  - the user is the owner of the room, OR
    //  - the user is an admin
    const isOwner = room.owner.toString() === token.sub;
    const isAdmin = token.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        {
          error: "Access denied: only the owner or admin can delete this room",
        },
        { status: 403 },
      );
    }

    const result = await roomService.deleteRoomById(userId, id);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error deleting room:", error);
    return NextResponse.json(
      { error: "Failed to delete room" },
      { status: 500 },
    );
  }
};
