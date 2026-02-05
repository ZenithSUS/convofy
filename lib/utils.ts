import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { UAParser } from "ua-parser-js";
import { AxiosError } from "axios/";
import { getToken, JWT } from "next-auth/jwt";
import { verifyToken } from "./jwt";
import { NextRequest } from "next/server";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function axiosErrorMessage(error: AxiosError): string {
  if (error.response) {
    // Server responded with a status code
    switch (error.response.status) {
      case 400:
        return "Bad request. Please check your input.";
      case 401:
        return "Unauthorized. Please log in again.";
      case 403:
        return "Forbidden. You don’t have permission to do this.";
      case 404:
        return "Not found. The requested resource could not be found.";
      case 408:
        return "Request timeout. Please try again.";
      case 429:
        return "Too many requests. Please slow down.";
      case 500:
        return "Internal server error. Please try again later.";
      case 502:
        return "Bad gateway. Please try again.";
      case 503:
        return "Service unavailable. Please try again later.";
      case 504:
        return "Gateway timeout. Please try again later.";
      default:
        return `Unexpected error: ${error.response.status}`;
    }
  } else if (error.request) {
    // Request made but no response received
    return "No response from server. Please check your internet connection.";
  } else {
    // Something happened before request was sent
    if (error.code === "ECONNABORTED") {
      return "Request timeout. Please try again.";
    }
    return `Request error: ${error.message}`;
  }
}

export function getDeviceInfo(userAgent: string) {
  const parser = new UAParser(userAgent);
  return {
    browser: `${parser.getBrowser().name} ${parser.getBrowser().version}`,
    os: `${parser.getOS().name} ${parser.getOS().version}`,
    device: parser.getDevice().type || "Desktop",
  };
}

export async function getUserToken(req: NextRequest): Promise<JWT | null> {
  try {
    // Try NextAuth session token first
    let token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const authHeader = req.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const bearerToken = authHeader.substring(7);

        try {
          const decoded = await verifyToken(bearerToken);
          if (decoded) {
            token = {
              sub: decoded.sub,
              email: decoded.email,
              name: decoded.name,
              role: decoded.role,
            } as JWT;
          }
        } catch (error) {
          console.warn("Invalid Bearer token:", error);
        }
      }
    }

    return token;
  } catch (error) {
    console.error("Error getting user token:", error);
    return null;
  }
}
