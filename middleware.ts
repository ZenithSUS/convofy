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

  // Auth route rate limit
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

  // Upload rate limit
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

  // Auth protection
  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !token) {
    const loginUrl = new URL("/auth/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Protect /chat
  if (pathname.startsWith("/chat")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const loginUrl = new URL("/auth/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();
  response.headers.set("x-pathname", request.nextUrl.pathname);
  return response;
}

export const config = {
  matcher: ["/chat/:path*", "/api/:path*", "/auth/:path*"],
};
