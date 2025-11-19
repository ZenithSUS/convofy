import authService from "@/services/mongodb/auth.service";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  try {
    const data = await req.json();

    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const { alias, avatar } = data;

    if (!alias || typeof alias !== "string") {
      return NextResponse.json({ error: "Alias is required" }, { status: 400 });
    }

    const response = await authService.loginAsAnonymous(alias, avatar);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error logging in as anonymous:", error);
    return new Response("Error logging in as anonymous", { status: 500 });
  }
};
