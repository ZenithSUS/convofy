import cloudinary from "@/lib/cloudinary";
import { NextResponse } from "next/server";
import { Readable } from "stream";

export const runtime = "nodejs";

const folder =
  process.env.NODE_ENV === "development" ? "dev-uploads" : "uploads";

export async function POST(req: Request): Promise<Response> {
  try {
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

    const response = await new Promise<Response>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: folder },
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

export async function DELETE(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const publicId = url.searchParams.get("publicId");

    if (!publicId) {
      return new Response("No publicId provided", { status: 400 });
    }

    const response = await new Promise<Response>((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          console.error("Delete error:", error);
          reject(new Response(error.message, { status: 500 }));
        } else {
          resolve(NextResponse.json(result));
        }
      });
    });

    return response;
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Error:", error);
    return new Response(error.message, { status: 500 });
  }
}
