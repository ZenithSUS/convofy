import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import jwt from "jsonwebtoken";

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
