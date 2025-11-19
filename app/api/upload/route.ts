import { baseFolder } from "@/constants/base";
import cloudinary from "@/lib/cloudinary";
import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import path from "path";
import { v4 as uuid } from "uuid";
import { UploadApiErrorResponse, UploadApiResponse } from "cloudinary";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const searchParams = req.nextUrl.searchParams;
    const directory = searchParams.get("directory");

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return new Response("No file uploaded", { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    if (buffer.length === 0)
      return new Response("File is empty", { status: 400 });

    const uploadFolder = directory ? `${baseFolder}/${directory}` : baseFolder;
    const publicId = `${uuid()}_${path.parse(file.name).name}`;

    const response = await new Promise<Response>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: uploadFolder,
          resource_type: "auto",
          use_filename: false,
          unique_filename: true,
          public_id: publicId,
        },
        (err?: UploadApiErrorResponse, result?: UploadApiResponse) => {
          if (err) {
            console.error("Error uploading file:", err);
            reject(new Response(err.message, { status: 500 }));
          } else {
            resolve(NextResponse.json(result));
          }
        },
      );

      const readable = new Readable();
      readable._read = () => {};
      readable.push(buffer);
      readable.push(null);
      readable.pipe(uploadStream);
    });

    return response;
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Error:", error);
    return new Response(error.message, { status: 500 });
  }
}

export async function DELETE(req: NextRequest): Promise<Response> {
  try {
    const searchParams = req.nextUrl.searchParams;
    const folderToDelete = searchParams.get("folder");
    const publicId = searchParams.get("publicId");

    if (!folderToDelete && !publicId) {
      return new Response("No folder or publicId provided", { status: 400 });
    }

    if (folderToDelete) {
      // Delete all resource types in the folder
      const resourceTypes = ["image", "video", "raw"];

      for (const resourceType of resourceTypes) {
        try {
          const resources = await cloudinary.api.resources({
            type: "upload",
            prefix: folderToDelete,
            resource_type: resourceType,
            max_results: 500,
          });

          // Delete all files for this resource type
          for (const r of resources.resources) {
            await cloudinary.uploader.destroy(r.public_id, {
              resource_type: resourceType,
              invalidate: true,
            });
          }
        } catch {
          console.log(`No ${resourceType} resources in ${folderToDelete}`);
        }
      }

      // Delete the folder itself
      const result = await cloudinary.api.delete_folder(folderToDelete);
      return NextResponse.json(result);
    } else if (publicId) {
      // Delete the file
      const resourceTypes = ["image", "video", "raw"];

      for (const resourceType of resourceTypes) {
        try {
          const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
            invalidate: true,
          });

          console.log(`Deletion attempt (${resourceType}):`, result);

          // If successfully deleted, return immediately
          if (result.result === "ok") {
            return NextResponse.json(result);
          }
        } catch {
          console.log(`Failed to delete as ${resourceType}`);
          continue;
        }
      }

      // If we get here, file wasn't found in any resource type
      return new Response("File not found or already deleted", { status: 404 });
    }

    return new Response("Nothing deleted", { status: 400 });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Error deleting:", error);
    return new Response(error.message, { status: 500 });
  }
}
