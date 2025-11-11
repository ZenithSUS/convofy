import isValidEmail from "@/helper/email-validate";
import generateSecureToken from "@/helper/token-generator";
import EmailRecoveryTokenCache, {
  TokenData,
} from "@/lib/cache/cache-email-recovery-token";
import sendRecoveryEmail, {
  SendRecoveryEmailParams,
} from "@/lib/nodemailer/email-recovery";
import emailRecoveryLimit from "@/lib/redis/redis-email-recovery-limit";
import userService from "@/services/mongodb/user.service";
import { EmailRecoveryData } from "@/types/email";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/recover
 *
 * Recovers a user's password by sending a reset password email to the user.
 *
 * @param {string} email - The email address of the user to be recovered.
 *
 * @returns {JSONResponse} - A JSON response containing the recovery email status.
 *
 * @throws {BadRequest} - If the email is invalid or missing.
 * @throws {NotFound} - If the user account is not found.
 * @throws {InternalServerError} - If there is an error sending the recovery email.
 * @throws {TooManyRequests} - If the user has exceeded the rate limit for password recovery requests.
 */
export const POST = async (req: NextRequest) => {
  try {
    const data = await req.json();

    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const { email } = data;

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email format or missing email" },
        { status: 400 },
      );
    }

    // Rate limiting
    const { success, limit, remaining, reset } =
      await emailRecoveryLimit.limit(email);

    if (!success) {
      return NextResponse.json(
        { error: "Too many email recovery requests. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          },
        },
      );
    }

    // Check if the user is in the database
    const user = await userService.getUserByEmail(email);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const recoveryToken = generateSecureToken();
    const tokenData: TokenData = {
      userId: user._id,
      recoveryEmail: email,
      createdAt: new Date().toISOString(),
    };

    await EmailRecoveryTokenCache.set(recoveryToken, tokenData);

    const recoveryData: SendRecoveryEmailParams = {
      toEmail: email,
      userName: user.name,
      verificationToken: recoveryToken,
    };

    await sendRecoveryEmail(recoveryData);
    console.log("Recovery email sent to:", email);

    return NextResponse.json(
      { message: "Recovery email sent", expiresIn: 300 },
      {
        status: 200,
        headers: {
          "X-RateLimit-Remaining": remaining.toString(),
        },
      },
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 },
    );
  }
};

export const GET = async (req: NextRequest) => {
  try {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing token" },
        { status: 400 },
      );
    }

    const tokenData = await EmailRecoveryTokenCache.get(token);
    const tokenExpiration = await EmailRecoveryTokenCache.expiration(token);
    const expiresAt =
      Date.now() + (tokenExpiration > 0 ? tokenExpiration * 1000 : 0);

    if (!tokenData) {
      return NextResponse.json(
        { error: "Token is not valid or has expired" },
        { status: 404 },
      );
    }

    const authorizedUser = await userService.getUserById(tokenData.userId);

    if (!authorizedUser) {
      return NextResponse.json(
        { error: "This user does not exist" },
        { status: 404 },
      );
    }

    const tokenRecoveryData: EmailRecoveryData = {
      recoveryEmail: tokenData.recoveryEmail,
      expiresIn: new Date(expiresAt).toISOString(),
    };

    return NextResponse.json(tokenRecoveryData, { status: 200 });
  } catch (error) {
    console.error("Error to get recovery email token:", error);
    return NextResponse.json(
      { error: "Failed to get recovery email token" },
      { status: 500 },
    );
  }
};

/**
 * PUT /api/auth/recover
 *
 * Recovers a user's password by validating an email recovery token and updating the user's password.
 *
 * @param {string} token - The email recovery token to be validated.
 * @param {string} newPassword - The new password to be set for the user.
 *
 * @returns {JSONResponse} - A JSON response containing the recovery result.
 *
 * @throws {BadRequest} - If the token or new password is invalid or missing.
 * @throws {NotFound} - If the user account is not found.
 * @throws {InternalServerError} - If there is an error validating the email recovery token or updating the user's password.
 */
export const PUT = async (req: NextRequest) => {
  try {
    const data = await req.json();

    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const { token, newPassword } = data;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing token" },
        { status: 400 },
      );
    }

    if (!newPassword || typeof newPassword !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing new password" },
        { status: 400 },
      );
    }

    const tokenData = await EmailRecoveryTokenCache.get(token);

    if (!tokenData) {
      return NextResponse.json(
        { error: "Token is not valid or has expired" },
        { status: 404 },
      );
    }

    const authorizedUser = await userService.getUserById(tokenData.userId);

    if (!authorizedUser) {
      return NextResponse.json(
        { error: "This user does not exist" },
        { status: 404 },
      );
    }

    if (tokenData.userId.toString() !== authorizedUser._id.toString()) {
      return NextResponse.json(
        { error: "This user does not exist" },
        { status: 404 },
      );
    }

    const updatedUser = await userService.updatePassword(
      authorizedUser._id,
      newPassword,
    );

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 500 },
      );
    }

    await EmailRecoveryTokenCache.invalidate(token);

    return NextResponse.json(
      { message: "Password updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error to recover password:", error);
    return NextResponse.json(
      { error: "Failed to recover password" },
      { status: 500 },
    );
  }
};

export const DELETE = async () => {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
};

export const HEAD = async () => {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
};

export const PATCH = async () => {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
};
