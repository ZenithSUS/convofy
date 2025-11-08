import userService from "@/services/mongodb/user.service";
import { NextResponse, NextRequest } from "next/server";
import { getUserToken } from "@/lib/utils";

/**
 * GET /api/users
 *
 * Fetches all users from the database, but only if the user is an admin.
 *
 * @returns {Promise<NextResponse>} - A promise that resolves with a JSON response containing the list of users or an error message.
 */
export const GET = async (req: NextRequest) => {
  try {
    // Authenticate
    const token = await getUserToken(req);

    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2Check role (row-level or role-based security)
    if (token.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3️⃣ Fetch users (only if admin)
    const users = await userService.getUsers();

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
};
