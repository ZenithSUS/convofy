import authService from "@/services/mongodb/auth.service";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
  try {
    const data: { id: string } = await req.json();
    const { id } = data;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 },
      );
    }

    const response = authService.logoutUser(id);
    return NextResponse.json(
      { message: "Logout successful", response },
      { status: 200 },
    );
  } catch (error) {
    console.error("Logout Error:", error);
    return NextResponse.json(
      { error: "Failed to log out user" },
      { status: 500 },
    );
  }
};
