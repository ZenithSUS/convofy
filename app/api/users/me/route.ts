import userService from "@/services/mongodb/user.service";
import { User } from "@/types/user";
import { NextResponse } from "next/server";

export const PUT = async (req: Request) => {
  try {
    const data: Partial<User> = await req.json();
    console.log("Data:", data);

    if (!data && typeof data !== "object") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const response = await userService.updateUser(data);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
};
