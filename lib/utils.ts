import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import jwt from "jsonwebtoken";
import { UAParser } from "ua-parser-js";
import { AxiosError } from "axios/";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function signJwt(data: { id: string; email: string }) {
  return jwt.sign(
    data,
    process.env.JWT_SECRET!,
    {
      expiresIn: "30d",
    },
    (err, token) => {
      if (err) throw err;
      return token;
    },
  );
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

export function getDeviceInfo(userAgent: string, ip: string) {
  const parser = new UAParser(userAgent);
  return {
    browser: `${parser.getBrowser().name} ${parser.getBrowser().version}`,
    os: `${parser.getOS().name} ${parser.getOS().version}`,
    device: parser.getDevice().type || "Desktop",
    ip,
  };
}
