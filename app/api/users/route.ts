import userService from "@/services/user.service";
import { NextResponse } from "next/server";

/**
 * This route is used to get all users
 * @param req
 * @returns All users
 */
export const GET = async () => {
  const users = await userService.getUsers();

  if (!users) return NextResponse.json([], { status: 200 });

  return NextResponse.json(users, { status: 200 });
};
