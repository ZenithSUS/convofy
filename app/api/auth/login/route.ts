import { connectToDatabase } from "@/lib/mongodb";
import { loginUser } from "@/services/auth.service";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
  try {
    await connectToDatabase();
    const data: { email: string; password: string } = await req.json();
    const response = await loginUser(data.email, data.password);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error logging in:", error);
    return new Response(error.message || "Error logging in", { status: 401 });
  }
};
