import { sendEmailChangeVerification } from "@/lib/nodemailer/email-verification";
import { getUserToken } from "@/lib/utils";
import userService from "@/services/mongodb/user.service";
import emailChangeLimit from "@/lib/redis/redis-email-change-limit";
import { NextRequest, NextResponse } from "next/server";
import isValidEmail from "@/helper/email-validate";
import generateSecureToken from "@/helper/token-generator";
import EmailChangeTokenCache, {
  TokenData,
} from "@/lib/cache/cache-email-change-token";
import EmailChangePendingCache, {
  EmailPendingData,
} from "@/lib/cache/cache-email-change-pending";

export const POST = async (req: NextRequest) => {
  try {
    // Authentication
    const token = await getUserToken(req);

    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = token.sub;

    // Rate limiting (prevent spam)
    const {
      success,
      limit: rateLimit,
      remaining,
      reset,
    } = await emailChangeLimit.limit(userId);

    if (success) {
      return NextResponse.json(
        { error: "Too many email change requests. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimit.toString(),
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

    const { newEmail, currentPassword, isAnyOAuth } = data;
    console.log("Data:", newEmail, currentPassword, isAnyOAuth);

    // Validate new email
    if (!newEmail || typeof newEmail !== "string") {
      return NextResponse.json(
        { error: "Missing required field: newEmail" },
        { status: 400 },
      );
    }

    const trimmedNewEmail = newEmail.trim().toLowerCase();

    if (!isValidEmail(trimmedNewEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    // Require current password for security
    if (
      (!currentPassword || typeof currentPassword !== "string") &&
      !isAnyOAuth
    ) {
      return NextResponse.json(
        { error: "Current password is required to change email" },
        { status: 400 },
      );
    }

    // Get current user from database
    const user = await userService.getUserById(userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify current password (if there is no OAuth provider)
    if (!isAnyOAuth) {
      const isPasswordValid = await userService.verifyPassword(
        userId,
        currentPassword,
      );

      if (!isPasswordValid) {
        console.warn(
          `Failed email change attempt: User ${userId} - Incorrect password`,
        );
        return NextResponse.json(
          { error: "Incorrect password" },
          { status: 401 },
        );
      }
    }

    // Check if new email is same as current
    if (trimmedNewEmail === user.email.toLowerCase()) {
      return NextResponse.json(
        { error: "New email must be different from current email" },
        { status: 400 },
      );
    }

    // Check if new email is already in use
    const existingUser = await userService.getUserByEmail(trimmedNewEmail);

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 },
      );
    }

    // Generate cryptographically secure token
    const verificationToken = generateSecureToken();

    // Store token in Redis with 15-minute expiration
    const tokenData: TokenData = {
      userId,
      currentEmail: user.email,
      newEmail: trimmedNewEmail,
      createdAt: new Date().toISOString(),
    };

    const emailData: EmailPendingData = {
      token: verificationToken,
      newEmail: trimmedNewEmail,
    };

    // Store token and pending data in Redis
    await EmailChangeTokenCache.set(verificationToken, tokenData);
    await EmailChangePendingCache.set(userId, emailData);

    // Send verification email to BOTH addresses
    await Promise.all([
      // Email 1: Verification email TO the NEW email address
      sendEmailChangeVerification({
        toEmail: trimmedNewEmail,
        userName: user.name,
        verificationToken,
        emailType: "verification",
      }),

      // Email 2: Security notification TO the CURRENT email address
      sendEmailChangeVerification({
        toEmail: user.email,
        userName: user.name,
        newEmail: trimmedNewEmail,
        emailType: "notification",
      }),
    ]);

    // Log the attempt (audit trail)
    console.info(
      `Email change initiated: User ${userId} (${user.email} -> ${trimmedNewEmail})`,
    );

    return NextResponse.json(
      {
        message:
          "Verification email sent. Please check your new email address.",
        expiresIn: 900, // seconds
      },
      {
        status: 200,
        headers: {
          "X-RateLimit-Remaining": remaining.toString(),
        },
      },
    );
  } catch (error) {
    console.error("Error initiating email change:", error);
    return NextResponse.json(
      { error: "Failed to initiate email change" },
      { status: 500 },
    );
  }
};

export const DELETE = async () => {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
};

export const PATCH = async () => {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
};

export const HEAD = async () => {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
};
