import userService from "@/services/mongodb/user.service";
import { CreateLinkedAccount } from "@/types/user";
import { NextResponse } from "next/server";

export const POST = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;
    const data: Omit<CreateLinkedAccount, "id"> = await req.json();

    if (!data || typeof data !== "object") {
      return NextResponse.json("Unprocessable entity", { status: 422 });
    }

    const response = await userService.linkedUserCredentials(
      id,
      data.credentials,
      data.linkedAccount,
    );

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json("Error creating user", { status: 500 });
  }
};
