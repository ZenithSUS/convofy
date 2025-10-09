import cloudinary from "@/lib/cloudinary";
import { NextResponse } from "next/server";
import { Readable } from "stream";

export const runtime = "nodejs";

export const POST = async (req: Request) => {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response("No file uploaded", { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "uploads" },
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
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Error:", error);
    return new Response(error.message, { status: 500 });
  }
};
