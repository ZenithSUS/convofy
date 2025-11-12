import authService from "@/services/mongodb/auth.service";
import authRatelimit from "@/lib/redis/redis-auth-limit";
import { getUserToken } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export const POST = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    //  Authentication - user must be logged in
    const token = await getUserToken(req);

    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loggedInUserId = new ObjectId(token.sub);
    const targetUserId = (await params).id;

    if (!targetUserId || !ObjectId.isValid(targetUserId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Authorization - users can only verify their OWN password
    if (loggedInUserId.toString() !== targetUserId) {
      return NextResponse.json(
        { error: "Forbidden: You can only verify your own password" },
        { status: 403 },
      );
    }

    // Get client IP for rate limiting
    const getClientIp = (request: NextRequest): string => {
      const forwarded = request.headers.get("x-forwarded-for");
      const realIp = request.headers.get("x-real-ip");
      return forwarded?.split(",")[0].trim() || realIp || "127.0.0.1";
    };

    const ip = getClientIp(req);
    const rateLimitKey = `${loggedInUserId.toString()}:${ip}`;

    // Strict rate limiting for password verification
    const { success, limit, remaining, reset } =
      await authRatelimit.limit(rateLimitKey);

    if (!success) {
      // Log suspicious activity
      console.warn(
        `Rate limit exceeded for password verification: User ${loggedInUserId}, IP ${ip}`,
      );

      return NextResponse.json(
        { error: "Too many verification attempts. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
            "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        },
      );
    }

    // Parse and validate request body
    const data = await req.json();

    if (!data || typeof data !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const { password } = data;

    // Validate password
    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Missing required field: password" },
        { status: 400 },
      );
    }

    if (password.length < 1 || password.length > 128) {
      return NextResponse.json(
        { error: "Invalid password length" },
        { status: 400 },
      );
    }

    // delay to prevent timing attacks
    const startTime = Date.now();

    const isValid = await authService.verifyUser(targetUserId, password);

    //  Constant-time response (prevent timing attacks)
    const elapsedTime = Date.now() - startTime;
    const minResponseTime = 200; // milliseconds

    if (elapsedTime < minResponseTime) {
      await new Promise((resolve) => {
        setTimeout(resolve, minResponseTime - elapsedTime);
      });
    }

    // Log failed attempts for security monitoring
    if (!isValid) {
      console.warn(
        `Failed password verification attempt: User ${loggedInUserId}, IP ${ip}`,
      );
    }

    return NextResponse.json(
      {
        verified: isValid,
        remaining,
      },
      {
        status: isValid ? 200 : 401,
        headers: {
          "X-RateLimit-Remaining": remaining.toString(),
        },
      },
    );
  } catch (error) {
    console.error("Error verifying user:", error);
    return NextResponse.json(
      { error: "Failed to verify user" },
      { status: 500 },
    );
  }
};
