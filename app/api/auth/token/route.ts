import { NextResponse } from "next/server";
import { generateToken } from "@/lib/jwt";
import authService from "@/services/mongodb/auth.service";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    // Use your existing login service to validate credentials
    const user = await authService.loginUser(email, password);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Generate JWT token (same secret as NextAuth)
    const token = await generateToken({
      _id: user._id,
      email: user.email,
      name: user.name,
    });

    // Return token for Postman/API clients
    return NextResponse.json(
      {
        success: true,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          status: user.status,
          lastActive: user.lastActive,
        },
        token, // For Postman/API clients
        message: "Token generated. Use this in Authorization: Bearer header",
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    const error = err as { message: string };

    console.error("Token generation error:", error);

    if (error.message === "Invalid credentials") {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
