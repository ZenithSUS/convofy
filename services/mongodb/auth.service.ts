import bcrypt from "bcrypt";
import User from "@/models/User";
import { User as UserType } from "@/types/user";

export const authService = {
  /**
   * Registers a new user in the database.
   * If the email is already registered, an error will be thrown.
   * If a password is provided, it will be hashed before being stored.
   * @param {UserType} data - The user data to be registered.
   * @returns {Promise<{ id: string, email: string, name: string }>} - A promise that resolves with the newly created user.
   * @throws {Error} - If there was an error while registering the user.
   */
  async registerUser(data: UserType) {
    try {
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

  /**
   * Logs a user in.
   * Checks if the user exists and if the password matches the stored hash.
   * If the user is valid, it updates the user's status to "online" and last active date.
   * Returns the logged in user, excluding the password.
   * @throws {Error} - If the email or password is invalid.
   */
  async loginUser(email: string, password: string) {
    try {
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

  /**
   * Logs out a user by updating their status to "offline" and last active date to the current time.
   * @param {string} id - The ID of the user to log out.
   * @returns {Promise<UserType>} - A promise that resolves with the logged out user, excluding the password.
   * @throws {Error} - If the user is not found.
   */
  async logoutUser(id: string) {
    try {
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
