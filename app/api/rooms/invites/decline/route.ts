import baseFolder from "@/constants/baseFolder";
import cloudinary from "@/lib/cloudinary";
import { getUserToken } from "@/lib/utils";
import roomService from "@/services/mongodb/room.service";
import { UploadApiErrorResponse } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  try {
    const token = await getUserToken(req);

    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const authUser = token.sub;

    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const { roomId, userId } = data;

    if (!roomId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const room = await roomService.findRoomById(roomId);

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 401 });
    }

    if (authUser !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await roomService.declineRoomInvite(userId, roomId);

    let totalDeletedFiles = 0;

    if (response && response?.members.length > 0) {
      // Just target the parent room folder
      const roomFolder = `${baseFolder}/rooms/${roomId}`;

      const resourceTypes: ("image" | "video" | "raw")[] = [
        "image",
        "video",
        "raw",
      ];

      // Delete all resources in the room folder (recursive)
      for (const type of resourceTypes) {
        let nextCursor: string | undefined = undefined;

        do {
          const res = await cloudinary.api.resources({
            prefix: roomFolder,
            type: "upload",
            resource_type: type,
            max_results: 500,
            next_cursor: nextCursor,
          });

          if (res.resources.length > 0) {
            await Promise.all(
              res.resources.map((r: { public_id: string }) =>
                cloudinary.uploader.destroy(r.public_id, {
                  resource_type: type,
                }),
              ),
            );

            totalDeletedFiles += res.resources.length;
          }

          nextCursor = res.next_cursor;
        } while (nextCursor);
      }

      // Delete the parent folder (this will delete all empty subfolders)
      try {
        await cloudinary.api.delete_folder(roomFolder);
        console.log("Deleted folder:", roomFolder);
      } catch (err: unknown) {
        const cloudinaryError = err as UploadApiErrorResponse;
        console.warn(
          "Could not delete folder:",
          roomFolder,
          cloudinaryError.message,
        );
      }
    }

    return NextResponse.json(
      {
        data: response,
        message: `Deleted all media for room ${roomId}`,
        deletedFiles: totalDeletedFiles,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error declining invite:", error);
    return NextResponse.json(
      { error: "Failed to decline invite" },
      { status: 500 },
    );
  }
};
