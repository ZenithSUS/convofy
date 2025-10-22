import { getMessagesByUserAndFileType } from "@/services/mongodb/message.service";
import { NextResponse } from "next/server";

export const GET = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const url = new URL(req.url).searchParams;

    const limit = Number(url.get("limit")) || 0;
    const offset = Number(url.get("offset")) || 0;

    const id = (await params).id;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 },
      );
    }

    const response = await getMessagesByUserAndFileType(id, limit, offset);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching media:", error);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500 },
    );
  }
};
