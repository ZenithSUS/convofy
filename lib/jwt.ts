import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET! || process.env.JWT_SECRET!,
);
const JWT_EXPIRES_IN = "30d";

export interface TokenPayload {
  sub: string; // user ID
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

/**
 * Generates a JWT token for the given user
 * @param user - User object with _id, email, and name properties
 * @returns A promise that resolves to a JWT token string
 * @throws If the user object is invalid or if there is an error with the JWT library
 */
export async function generateToken(user: {
  _id: string;
  email: string;
  name: string;
}): Promise<string> {
  const token = await new SignJWT({
    sub: user._id.toString(),
    email: user.email,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verifies a JWT token and returns the payload if valid, otherwise returns null.
 * @param token - The JWT token to verify
 * @returns A promise that resolves to the token payload if valid, otherwise resolves to null
 * @throws If there is an error with the JWT library
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}
