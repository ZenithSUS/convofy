import userService from "@/services/mongodb/user.service";
import { NextResponse } from "next/server";

export const PATCH = async (req: Request) => {
  try {
    const data = await req.json();

    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const { id, currentPassword, newPassword } = data;

    const response = await userService.changePassword(
      id,
      currentPassword,
      newPassword,
    );

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 },
    );
  }
};
