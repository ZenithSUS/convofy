import authService from "@/services/mongodb/auth.service";
import { NextResponse } from "next/server";

export const POST = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const data = await req.json();
    const { id } = await params;

    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "Invalid Data" }, { status: 400 });
    }

    const { password } = data;

    if (!id || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const response = await authService.verifyUser(id, password);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error verifying user:", error);
    return NextResponse.json(
      { error: "Failed to verify user" },
      { status: 500 },
    );
  }
};
