import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import authRatelimit from "@/lib/redis/redis-auth-limit";
import uploadLimit from "./lib/redis/redis-upload.limit";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const protectedRoutes = [
    "/api/chat",
    "/api/typing",
    "/api/message",
    "/api/rooms",
    "/api/upload",
    "/api/users",
  ];

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const ip =
    token?.sub ||
    request.headers.get("x-forwarded-for") ||
    "127.0.0.1" ||
    "localhost";

  // Apply rate limiting in auth routes
  if (
    pathname.includes("/api/auth/login") ||
    pathname.includes("/api/auth/register")
  ) {
    try {
      const { success, limit, reset, remaining } =
        await authRatelimit.limit(ip);
      if (!success) {
        return new NextResponse("Too many requests", {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          },
        });
      }

      console.log(`Auth rate limit for ${ip}: ${remaining}/${limit} remaining`);
    } catch (error) {
      console.error("Error applying rate limit:", error);
      return NextResponse.json("Please try again later", { status: 500 });
    }
  }

  // Apply rate limiting for the upload route
  if (pathname.startsWith("/api/upload")) {
    try {
      const { success, limit, reset, remaining } = await uploadLimit.limit(ip);
      if (!success) {
        return new NextResponse("Too many requests", {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          },
        });
      }

      console.log(
        `Upload rate limit for ${ip}: ${remaining}/${limit} remaining`,
      );
    } catch (error) {
      console.error("Error applying rate limit:", error);
      return NextResponse.json("Please try again later", { status: 500 });
    }
  }

  // Redirect to login if not authenticated
  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !token) {
    const loginUrl = new URL("/auth/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Protect the /chat route
  if (pathname.startsWith("/chat")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      // Redirect to login if not authenticated
      const loginUrl = new URL("/auth/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/chat/:path*", "/api/:path*"],
};
