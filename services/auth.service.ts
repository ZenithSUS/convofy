import bcrypt from "bcrypt";
import User from "@/models/User";
import { User as UserType } from "@/types/user";

export async function registerUser(data: UserType) {
  const existing = await User.findOne({ email: data.email });
  if (existing) throw new Error("Email already registered");

  if (data.password !== undefined && data.password.length > 0) {
    const hashed = await bcrypt.hash(data.password, 10);
    const newUser = await User.create({
      ...data,
      password: hashed,
      status: "online",
    });

    return { id: newUser._id, email: newUser.email, name: newUser.name };
  }

  const newUser = await User.create({ ...data, status: "online" });
  return {
    id: newUser._id,
    email: newUser.email,
    name: newUser.name,
    avatar: newUser.avatar,
    status: newUser.status,
    lastActive: newUser.lastActive,
    createdAt: newUser.createdAt,
  };
}

export async function loginUser(email: string, password: string) {
  const user = await User.findOne({ email });

  if (!user) throw new Error("Invalid credentials");

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error("Invalid credentials");

  await User.findOneAndUpdate(
    { email },
    { lastActive: new Date(), status: "online" },
  );

  // Exclude password from response
  user.password = undefined;

  return user;
}
