import bcrypt from "bcrypt";
import User from "@/models/User";
import { User as UserType } from "@/types/user";
import { connectToDatabase } from "@/lib/mongodb";

export const authService = {
  async registerUser(data: UserType) {
    try {
      await connectToDatabase();
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
    } catch (error) {
      throw error;
    }
  },

  async loginUser(email: string, password: string) {
    try {
      await connectToDatabase();
      const user = await User.findOne({ email });

      if (!user) throw new Error("Invalid credentials");

      const valid = await bcrypt.compare(password, user.password || "");
      if (!valid) throw new Error("Invalid credentials");

      const userUpdated = await User.findOneAndUpdate(
        { email },
        { lastActive: new Date(), status: "online" },
        { new: true, fields: "-password" },
      );

      return userUpdated;
    } catch (error) {
      throw error;
    }
  },

  async setUserOnline(id: string) {
    try {
      await connectToDatabase();
      const user = await User.findOneAndUpdate(
        { _id: id },
        { status: "online", lastActive: new Date() },
        { new: true, fields: "-password" },
      );

      return user;
    } catch (error) {
      throw error;
    }
  },

  async logoutUser(id: string) {
    try {
      await connectToDatabase();
      const user = await User.findByIdAndUpdate(
        { _id: id },
        { status: "offline", lastActive: new Date() },
        { new: true, fields: "-password" },
      );

      if (!user) throw new Error("User not found");

      return user;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Logs in as an anonymous user.
   * Creates a new user with the provided alias and avatar, and marks them as anonymous.
   * The user's email will be in the format of `${alias}@anonymous.com`.
   * The user's status will be set to "online" and their last active date will be set to the current time.
   * The user's role will be set to "anonymous".
   * @param {string} alias - The alias of the anonymous user.
   * @param {string} avatar - The avatar of the anonymous user.
   * @returns {Promise<UserType>} - A promise that resolves with the newly created anonymous user.
   * @throws {Error} - If there was an error while creating the anonymous user.
   */
  async loginAsAnonymous(alias: string, avatar: string) {
    try {
      await connectToDatabase();
      const user = await User.create({
        email: `${alias}@anonymous.com`,
        name: alias,
        isAnonymous: true,
        anonAlias: alias,
        anonAvatar: avatar,
        status: "online",
        linkedAccounts: [],
        lastActive: new Date(),
        createdAt: new Date(),
        role: "anonymous",
      });

      return user;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Verifies a user's credentials.
   * Checks if the user exists and if the password matches the stored hash.
   * If the user is valid, it returns "user verified".
   * @throws {Error} - If the user is not found or if the password is invalid.
   * @param {string} id - The ID of the user to verify.
   * @param {string} password - The password of the user to verify.
   * @returns {Promise<string>} - A promise that resolves with "user verified" if the user is valid.
   */
  async verifyUser(id: string, password: string) {
    try {
      await connectToDatabase();
      const user = await User.findOne({ _id: id });

      if (!user) throw new Error("User not found");

      const valid = await bcrypt.compare(password, user.password);

      if (!valid) throw new Error("Invalid credentials");

      return "user verified";
    } catch (error) {
      throw error;
    }
  },
};

export default authService;
