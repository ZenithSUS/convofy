import EmailChangePendingCache from "@/lib/cache/cache-email-change-pending";
import EmailChangeTokenCache from "@/lib/cache/cache-email-change-token";
import { getUserToken } from "@/lib/utils";
import userService from "@/services/mongodb/user.service";
import { UserLinkedAccount } from "@/types/user";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/users/email/verify
 *
 * Verifies an email change token to ensure that the user is authorized to change their email address.
 *
 * @param {string} token - The email change token to be verified.
 *
 * @returns {JSONResponse} - A JSON response containing the email change token validation result.
 *
 * @throws {Unauthorized} - If the user is not authorized to change their email address.
 * @throws {BadRequest} - If the token is invalid or missing.
 * @throws {NotFound} - If the user account is not found.
 * @throws {InternalServerError} - If there is an error validating the email change token.
 */
export const GET = async (req: NextRequest) => {
  try {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get("token");

    // Authenticate the request
    const userToken = await getUserToken(req);
    if (!userToken || !userToken.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    //  Validate token input
    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing token" },
        { status: 400 },
      );
    }

    // Verify cached token
    const tokenData = await EmailChangeTokenCache.get(token);

    if (!tokenData) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 },
      );
    }

    const tokenExpiration = await EmailChangeTokenCache.expiration(token);
    const expiresAt =
      Date.now() + (tokenExpiration > 0 ? tokenExpiration * 1000 : 0);

    // Prevent cross-user access
    if (userToken.sub !== tokenData.userId) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 },
      );
    }

    // Ensure user still exists
    const authorizedUser = await userService.getUserById(
      tokenData.userId,
      false,
    );
    if (!authorizedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return valid response
    return NextResponse.json(
      {
        currentEmail: tokenData.currentEmail,
        newEmail: tokenData.newEmail,
        createdAt: tokenData.createdAt,
        requiresPassword: !!authorizedUser.password,
        expiresIn: new Date(expiresAt).toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Email change token validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate email change request" },
      { status: 500 },
    );
  }
};

/**
 * Validate and complete an email change request.
 *
 * @remarks
 * This API endpoint validates the provided email change token and, if valid, updates the user's email.
 * The request body should contain the following fields:
 * - `newEmail`: The new email address to update the user with.
 * - `currentEmail`: The current email address associated with the user.
 * - `password`: The user's password to verify the email change request.
 * - `token`: The email change verification token.
 * - `userId`: The ID of the user requesting the email change.
 *
 * @returns
 * A JSON response with the updated user object and a status code of 200 on success.
 * A JSON response with an error message and a status code of 400 or 500 on failure.
 */
export const POST = async (req: NextRequest) => {
  try {
    const userToken = await getUserToken(req);

    const data = await req.json();

    if (!userToken || !userToken.sub) {
      return NextResponse.json(
        { error: "Unauthorized Access" },
        { status: 401 },
      );
    }

    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Parse and validate request body
    const { newEmail, currentEmail, password, token, userId } = data;

    // Check if the user is authorized to verify this email change
    if (userToken.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized Access" },
        { status: 401 },
      );
    }

    // Check if the user exists
    const authorizedUser = await userService.getUserById(userId, false);

    if (!authorizedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify the token data
    const tokenData = await EmailChangeTokenCache.get(token);

    if (!tokenData) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 },
      );
    }

    // Prevent cross-user access
    if (tokenData.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 },
      );
    }

    // Ensure the token is still valid
    if (
      tokenData.currentEmail !== currentEmail ||
      tokenData.newEmail !== newEmail
    ) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 },
      );
    }

    // Verify the password
    const verifyPassword = await userService.verifyPassword(userId, password);

    if (!verifyPassword) {
      return NextResponse.json(
        { error: "Invalid Credentials" },
        { status: 400 },
      );
    }

    // Update the user's email
    const updatedUser = await userService.updateUser({
      _id: userId,
      email: newEmail,
    });

    const userLinkCredentials: UserLinkedAccount = {
      provider: "credentials",
      providerAccount: newEmail,
      providerAccountId: authorizedUser._id.toString(),
    };

    // Replace the credentials
    await userService.replaceCredentialProvider(userId, userLinkCredentials);

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to update user email" },
        { status: 500 },
      );
    }

    // Remove the cache token
    await Promise.all([
      EmailChangeTokenCache.invalidate(token),
      EmailChangePendingCache.invalidate(userId),
    ]);

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error("Email change token validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate email change request" },
      { status: 500 },
    );
  }
};

export const HEAD = async () => {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
};

export const DELETE = async () => {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
};

export const PATCH = async () => {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
};

export const PUT = async () => {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
};
