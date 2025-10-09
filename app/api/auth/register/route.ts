import { registerUser } from "@/services/auth.service";
import { User as UserType } from "@/types/user";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
  try {
    // Get the data from the request
    const data: UserType = await req.json();

    if (!data || typeof data !== "object") {
      return new Response("Unprocessable entity", { status: 422 });
    }

    const user = await registerUser(data);

    return NextResponse.json(
      { message: "User created successfully", user },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return new Response("Error creating user", { status: 500 });
  }
};
