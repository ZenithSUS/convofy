import { connectToDatabase } from "@/lib/mongodb";
import authService from "@/services/mongodb/auth.service";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
  try {
    await connectToDatabase();
    const data: { email: string; password: string } = await req.json();

    if (
      !data.email ||
      !data.password ||
      typeof data.email !== "string" ||
      typeof data.password !== "string"
    ) {
      return new Response("Missing required fields", { status: 400 });
    }

    const response = await authService.loginUser(data.email, data.password);
    return NextResponse.json(response);
  } catch (error: unknown) {
    const err = error as { message: string };
    console.error("Error logging in:", err);
    return new Response(err.message || "Error logging in", { status: 401 });
  }
};

export const GET = async () => {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
};
