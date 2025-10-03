import { connectToDatabase } from "@/lib/mongodb";

export const POST = async (req: Request) => {
  await connectToDatabase();
};
