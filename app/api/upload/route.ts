import baseFolder from "@/constants/baseFolder";
import cloudinary from "@/lib/cloudinary";
import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const searchParams = req.nextUrl.searchParams;
    const directory = searchParams.get("directory");

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response("No file uploaded", { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (buffer.length === 0) {
      return new Response("File is empty", { status: 400 });
    }

    const uploadFolder = directory ? `${baseFolder}/${directory}` : baseFolder;

    const response = await new Promise<Response>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: uploadFolder, resource_type: "auto" },
        (error, result) => {
          if (error) {
            console.error("Upload error:", error);
            reject(new Response(error.message, { status: 500 }));
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
    const folderToDelete = searchParams.get("folder"); // optional
    const publicId = searchParams.get("publicId"); // optional

    if (!folderToDelete && !publicId) {
      return new Response("No folder or publicId provided", { status: 400 });
    }

    if (folderToDelete) {
      // 1️List all resources in the folder
      const resources = await cloudinary.api.resources({
        type: "upload",
        prefix: folderToDelete, // prefix is used for folder path
        max_results: 500,
      });

      // Delete all files in the folder
      for (const r of resources.resources) {
        await cloudinary.uploader.destroy(r.public_id);
      }

      // Delete the folder itself
      const result = await cloudinary.api.delete_folder(folderToDelete);
      return NextResponse.json(result);
    } else if (publicId) {
      // Delete single file
      const result = await cloudinary.uploader.destroy(publicId);
      return NextResponse.json(result);
    }

    return new Response("Nothing deleted", { status: 400 });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Error deleting:", error);
    return new Response(error.message, { status: 500 });
  }
}
