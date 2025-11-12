import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import getUserRelatedFolders from "@/helper/get-related-folders";
import roomService from "@/services/mongodb/room.service";
import { getUserToken } from "@/lib/utils";
import { UploadApiErrorResponse } from "cloudinary";

export const DELETE = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const token = await getUserToken(req);
  if (!token?.sub)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (await params).id;
  if (!userId)
    return NextResponse.json(
      { error: "Missing required field: id" },
      { status: 400 },
    );
  if (userId !== token.sub)
    return NextResponse.json(
      { error: "You can only delete your own media/messages" },
      { status: 401 },
    );

  try {
    // Get all rooms the user has joined
    const roomsJoined = (await roomService.getUserJoinRoomIds(userId)).map(
      (r) => r._id.toString(),
    );

    // Get folders related to the user, deepest first
    let foldersToDelete = getUserRelatedFolders(userId, roomsJoined);
    // Reverse to delete deepest folders first
    foldersToDelete = foldersToDelete.reverse();

    let totalDeletedFiles = 0;

    const resourceTypes: ("image" | "video" | "raw")[] = [
      "image",
      "video",
      "raw",
    ];

    // Loop over each folder
    for (const folder of foldersToDelete) {
      for (const type of resourceTypes) {
        let nextCursor: string | undefined = undefined;

        do {
          const res = await cloudinary.api.resources({
            prefix: folder,
            type: "upload",
            resource_type: type,
            max_results: 500,
            next_cursor: nextCursor,
          });

          if (res.resources.length > 0) {
            // Delete all files in parallel
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

      const remaining = await cloudinary.api.resources({
        prefix: folder,
        type: "upload",
        max_results: 1,
      });

      if (remaining.resources.length === 0) {
        // Try deleting the folder after all resource types are gone
        try {
          await cloudinary.api.delete_folder(folder);
          console.log("Deleted folder:", folder);
        } catch (err: unknown) {
          const cloudinaryError = err as UploadApiErrorResponse;
          console.warn(
            "Could not delete folder:",
            folder,
            cloudinaryError.message,
          );
        }
      } else {
        console.warn(" Folder not empty, skipping delete:", folder);
      }
    }

    return NextResponse.json({
      message: `Deleted all media for user ${userId}`,
      deletedFiles: totalDeletedFiles,
      foldersDeleted: foldersToDelete.length,
    });
  } catch (err) {
    console.error("Error deleting user media:", err);
    return NextResponse.json(
      { error: "Error deleting user media" },
      { status: 500 },
    );
  }
};
