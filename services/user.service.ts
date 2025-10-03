import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { User as UserType } from "@/types/user";

export const createUser = async (data: UserType) => {
  await connectToDatabase();
  const user = await User.create(data);
  return user;
};

export const getUsers = async () => {
  await connectToDatabase();
  const users = await User.find({}, "-password").sort({ createdAt: -1 });
  return users;
};

export const getUserById = async (id: string) => {
  await connectToDatabase();
  const user = await User.findById(id, "-password");
  return user;
};

export const getUserByEmail = async (
  email: string,
): Promise<UserType | null> => {
  await connectToDatabase();
  const user = await User.findOne({ email }, "-password");
  return user;
};

export const updateUserStatus = async (
  id: string,
  status: "online" | "offline",
) => {
  await connectToDatabase();
  const user = await User.findOneAndUpdate(
    { id },
    { status, lastActive: new Date() },
    { new: true, fields: "-password" },
  );
  return user;
};
