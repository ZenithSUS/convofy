import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import authRatelimit from "@/lib/redis/redis-auth-limit";
import uploadLimit from "./lib/redis/redis-upload.limit";
import { getUserToken } from "./lib/utils";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get client IP
  const getClientIp = (request: NextRequest): string => {
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    return forwarded?.split(",")[0].trim() || realIp || "127.0.0.1";
  };

  // Get token once and reuse
  const token = await getUserToken(request);
  const ip = token?.sub || getClientIp(request);

  // Auth route rate limit
  if (pathname === "/api/auth/login" || pathname === "/api/auth/register") {
    try {
      const { success, limit, reset, remaining } =
        await authRatelimit.limit(ip);

      if (!success) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
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

      console.log(`Auth rate limit for ${ip}: ${remaining}/${limit} remaining`);
    } catch (error) {
      console.error("Error applying auth rate limit:", error);
      // Fail open - allow request to continue rather than blocking all traffic
      // Alternatively, fail closed for stricter security: return error response
    }
  }

  // Upload rate limit
  if (pathname.startsWith("/api/upload")) {
    try {
      const { success, limit, reset, remaining } = await uploadLimit.limit(ip);

      if (!success) {
        return NextResponse.json(
          { error: "Upload rate limit exceeded. Please try again later." },
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

      console.log(
        `Upload rate limit for ${ip}: ${remaining}/${limit} remaining`,
      );
    } catch (error) {
      console.error("Error applying upload rate limit:", error);
      // Fail open - allow request to continue
    }
  }

  // Protect authenticated API routes
  const protectedRoutes = [
    "/api/chat",
    "/api/typing",
    "/api/message",
    "/api/rooms",
    "/api/users",
  ];

  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 },
      );
    }
  }

  // Protect /chat pages
  if (pathname.startsWith("/chat")) {
    if (!token) {
      const loginUrl = new URL("/auth/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();
  response.headers.set("x-pathname", pathname);

  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: [
    "/chat/:path*",
    "/api/:path*",
    "/auth/:path*",
    // Exclude static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
