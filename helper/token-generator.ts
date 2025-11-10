import { randomBytes } from "crypto";

function generateSecureToken(): string {
  return randomBytes(32).toString("hex"); // 64-char hex string
}

export default generateSecureToken;
