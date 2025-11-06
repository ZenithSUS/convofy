import { connectToDatabase } from "@/lib/mongodb";
import User, { UserSession } from "@/models/User";
import {
  UserMessageDataStats,
  UserMediaDataStats,
  User as UserType,
  UserOAuthProviders,
  UserLinkedAccount,
} from "@/types/user";
import Message from "@/models/Message";
import Room from "@/models/Room";
import { pusherServer } from "@/lib/pusher";
import bcrypt from "bcrypt";

export const userService = {
  /**
   * Creates a new user in the database.
   *
   * @param {UserType} data - User data to be inserted into the database.
   * @returns {Promise<UserType>} - A promise that resolves with the newly created user.
   * @throws {Error} - If there was an error while creating the user.
   */
  async createUser(data: UserType): Promise<UserType> {
    try {
      await connectToDatabase();
      const user = await User.create(data);
      return user;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Retrieves all users from the database, excluding passwords.
   *
   * @returns {Promise<UserType[]>} - A promise that resolves with an array of users.
   * @throws {Error} - If there was an error while fetching the users.
   */
  async getUsers(): Promise<UserType[]> {
    try {
      await connectToDatabase();
      const users = await User.find({}, "-password").sort({ createdAt: -1 });
      return users;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Fetches a user from the database by their ID, excluding passwords.
   *
   * @param {string} id - The ID of the user to fetch.
   * @returns {Promise<UserType | null>} - A promise that resolves with the user if found, or null if not found.
   */
  async getUserById(id: string): Promise<UserType | null> {
    await connectToDatabase();
    const user = await User.findById(id, "-password");
    return user;
  },

  /**
   * Fetches a user from the database by their email, excluding passwords.
   *
   * @param {string} email - The email of the user to fetch.
   * @returns {Promise<UserType | null>} - A promise that resolves with the user if found, or null if not found.
   */
  async getUserByEmail(email: string): Promise<UserType | null> {
    await connectToDatabase();
    const user = await User.findOne({ email }, "-password");
    return user;
  },

  /**
   * Fetches user data stats, including the number of messages, media, and contacts.
   *
   * @param {string} userId - The ID of the user to fetch data for.
   * @returns {Promise<UserDataStats>} - A promise that resolves with the user data stats.
   * @throws {Error} - If there was an error while fetching the data.
   */
  async getUserDataStats(userId: string): Promise<UserMediaDataStats> {
    try {
      await connectToDatabase();
      const [messages, medias, rooms] = await Promise.all([
        Message.countDocuments({ sender: userId, type: "text" }),
        Message.countDocuments({
          sender: userId,
          $or: [{ type: "image" }, { type: "file" }],
        }),
        Room.countDocuments({ members: userId }),
      ]);

      const data: UserMediaDataStats = { messages, medias, contacts: rooms };

      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Retrieves user message stats, including the number of messages, edited messages, and deleted messages.
   *
   * @param {string} userId - The ID of the user to fetch message stats for.
   * @returns {Promise<UserMessageDataStats>} - A promise that resolves with the user message stats.
   * @throws {Error} - If there was an error while fetching the message stats.
   */
  async getUserMessageStats(userId: string): Promise<UserMessageDataStats> {
    try {
      await connectToDatabase();
      const [messages, editedMessages, nonTextMessages] = await Promise.all([
        Message.countDocuments({
          sender: userId,
        }),
        Message.countDocuments({ sender: userId, isEdited: true }),
        Message.countDocuments({ sender: userId, type: { $ne: "text" } }),
      ]);

      const data: UserMessageDataStats = {
        messages,
        nonTextMessages,
        editedMessages,
      };

      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Updates a user in the database.
   * @param {Partial<UserType>} data - The user data to update.
   * @returns {Promise<UserType | null>} - A promise that resolves with the updated user if found, or null if not found.
   * @throws {Error} - If there was an error while updating the user.
   */
  async updateUser(data: Partial<UserType>): Promise<UserType | null> {
    try {
      await connectToDatabase();
      const user = await User.findOneAndUpdate(
        { _id: data._id },
        { $set: data },
        { new: true, fields: "-password" },
      );

      return user;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Changes the password of a user by first verifying the current password.
   * If the current password is valid, it hashes the new password and updates the user's password.
   * @param {string} id - The ID of the user to change the password of.
   * @param {string} currentPassword - The current password of the user.
   * @param {string} newPassword - The new password of the user.
   * @returns {Promise<UserType>} - A promise that resolves with the updated user, excluding the password.
   * @throws {Error} - If the user is not found or if the current password is invalid.
   */
  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<UserType> {
    try {
      await connectToDatabase();

      const user = await User.findOne({ _id: id });

      if (!user) throw new Error("User not found");

      const verify = await bcrypt.compare(currentPassword, user.password);

      if (!verify) throw new Error("Invalid credentials");

      const hashed = await bcrypt.hash(newPassword, 10);

      const updatedUser = await User.findOneAndUpdate(
        { _id: id },
        { password: hashed },
        { new: true, fields: "-password" },
      );

      return updatedUser;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Updates the status of a user in the database.
   * @param {string} id - The ID of the user to update.
   * @param {"online" | "offline"} status - The new status of the user.
   * @returns {Promise<UserType | null>} - A promise that resolves with the updated user if found, or null if not found.
   */
  async updateUserStatus(
    id: string,
    status: "online" | "offline",
  ): Promise<UserType | null> {
    await connectToDatabase();
    const user = await User.findOneAndUpdate(
      { _id: id },
      { status, lastActive: new Date() },
      { new: true, fields: "-password" },
    );
    return user;
  },

  /**
   * Updates the status of a user in the database and broadcasts the new status to the user's Pusher channel.
   * @param {string} id - The ID of the user to update.
   * @param {"online" | "offline"} status - The new status of the user.
   * @returns {Promise<UserType | null>} - A promise that resolves with the updated user if found, or null if not found.
   */
  async updateLiveUserStatus(
    id: string,
    status: "online" | "offline",
  ): Promise<UserType | null> {
    await connectToDatabase();
    const user = await User.findOneAndUpdate(
      { _id: id },
      { status, lastActive: new Date() },
      { new: true, fields: "-password" },
    );

    const channelName = `user-${id}`;

    await pusherServer.trigger(
      channelName,
      "status-update",
      user.status as string,
    );

    return user;
  },

  /**
   * Links a user's credentials to an existing user account.
   * @param {string} id - The ID of the user to link credentials to.
   * @param {string} credentials - The email and password of the user to link.
   * @param {UserLinkedAccount} linkedAccounts - The linked OAuth account to add.
   * @returns {Promise<UserType>} - A promise that resolves with the updated user if found, or null if not found.
   * @throws {Error} - If the email is already registered or if there was an error while linking the credentials.
   */
  async linkedUserCredentials(
    id: string,
    credentials: { email: string; password: string },
    linkedAccounts: UserLinkedAccount,
  ): Promise<UserType> {
    try {
      await connectToDatabase();

      const linkedExists = await this.getUserByLinkedAccount(
        linkedAccounts.provider,
        linkedAccounts.providerAccount,
        linkedAccounts.providerAccountId,
      );

      if (linkedExists) {
        throw new Error("There is already an account with this email.");
      }

      const hash = await bcrypt.hash(credentials.password, 10);

      const user = await User.findByIdAndUpdate(
        { _id: id },
        {
          $push: {
            linkedAccounts: linkedAccounts,
          },
          $set: {
            email: credentials.email,
            password: hash,
          },
        },
        { new: true, fields: "-password" },
      );

      return user;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Find a user by their linked OAuth account
   * @param provider - The OAuth provider (google, github, etc.)
   * @param providerAccount - The provider's account email
   * @param providerAccountId - The provider's account ID
   * @returns The user if found, null otherwise
   */
  async getUserByLinkedAccount(
    provider: UserOAuthProviders,
    providerAccount: string,
    providerAccountId: string,
  ): Promise<UserType | null> {
    try {
      const user = await User.findOne({
        linkedAccounts: {
          $elemMatch: {
            provider: provider,
            providerAccount: providerAccount,
            providerAccountId: providerAccountId,
          },
        },
      });

      return user;
    } catch (error) {
      console.error("Error finding user by linked account:", error);
      return null;
    }
  },

  /**
   * Updates a user's linked accounts in the database.
   * @param {string} userId - The ID of the user to update.
   * @param {{ provider: string; providerAccount: string; providerAccountId: string }} account - The linked account to add.
   * @returns {Promise<UserType | null>} - A promise that resolves with the updated user if found, or null if not found.
   * @throws {Error} - If there was an error while updating the user.
   */
  async updateLinkedAccount(
    userId: string,
    account: UserLinkedAccount,
  ): Promise<UserType | null> {
    try {
      await connectToDatabase();
      const user = await User.findOneAndUpdate(
        { _id: userId },
        { $push: { linkedAccounts: account } },
        { new: true, fields: "-password" },
      );
      return user;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Unlinks a user's linked account from their profile in the database.
   * @param {string} userId - The ID of the user to unlink.
   * @param {{ provider: string; providerAccount: string; providerAccountId: string }} account - The linked account to unlink.
   * @returns {Promise<UserType | null>} - A promise that resolves with the updated user if found, or null if not found.
   * @throws {Error} - If there was an error while unlinking the account.
   */
  async unlinkAccount(
    userId: string,
    account: UserLinkedAccount,
  ): Promise<UserType | null> {
    try {
      await connectToDatabase();

      const query =
        account.provider === "credentials"
          ? {
              $pull: { linkedAccounts: account },
              $set: { password: null },
            }
          : { $pull: { linkedAccounts: account } };

      const user = await User.findByIdAndUpdate(
        { _id: userId },
        { ...query },
        { new: true, fields: "-password" },
      );

      return user;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Adds a new active session to a user's profile in the database.
   * @param {string} userId - The ID of the user to add the session to.
   * @param {UserSession} session - The active session to add.
   * @returns {Promise<UserType>} - A promise that resolves with the updated user.
   * @throws {Error} - If there was an error while updating the user.
   */
  async addUserSession(userId: string, session: UserSession) {
    return await User.findByIdAndUpdate(
      userId,
      {
        $push: { activeSessions: session },
        $set: { lastActive: new Date() },
      },
      { new: true },
    );
  },

  /**
   * Updates the last active date of a user's active session in the database.
   * @param {string} userId - The ID of the user to update.
   * @param {string} sessionId - The ID of the active session to update.
   * @returns {Promise<Document>} - A promise that resolves with the updated user document.
   */
  async updateSessionActivity(userId: string, sessionId: string) {
    return await User.updateOne(
      {
        _id: userId,
        "activeSessions.sessionId": sessionId,
      },
      {
        $set: {
          "activeSessions.$.lastActive": new Date(),
          lastActive: new Date(),
        },
      },
    );
  },

  /**
   * Revokes an active session of a user in the database.
   * @param {string} userId - The ID of the user to revoke the session of.
   * @param {string} sessionId - The ID of the active session to revoke.
   * @returns {Promise<Document>} - A promise that resolves with the updated user document.
   */
  async revokeSession(userId: string, sessionId: string) {
    return await User.findByIdAndUpdate(
      { _id: userId },
      { $pull: { activeSessions: { sessionId } } },
      { new: true },
    );
  },

  /**
   * Revokes all active sessions of a user in the database, except for the specified session ID.
   * @param {string} userId - The ID of the user to revoke the sessions of.
   * @param {string} [exceptSessionId] - The ID of the active session to exclude from revocation.
   * @returns {Promise<Document>} - A promise that resolves with the updated user document.
   */
  async revokeAllSessions(userId: string, exceptSessionId?: string) {
    const update = exceptSessionId
      ? { $pull: { activeSessions: { sessionId: { $ne: exceptSessionId } } } }
      : { $set: { activeSessions: [] } };

    return await User.findByIdAndUpdate(userId, update, { new: true });
  },

  /**
   * Removes all expired active sessions from all users in the database.
   * This should be run as a cron job to clean up expired sessions periodically.
   */
  async cleanExpiredSessions() {
    // Run this as a cron job
    return await User.updateMany(
      {},
      {
        $pull: {
          activeSessions: {
            expiresAt: { $lt: new Date() },
          },
        },
      },
    );
  },

  /**
   * Fetches all active sessions of a user from the database.
   * @param {string} userId - The ID of the user to fetch active sessions for.
   * @returns {Promise<UserSession[]>} - A promise that resolves with an array of active sessions of the user.
   */
  async getUserActiveSessions(userId: string) {
    const user = await User.findById(userId).select("activeSessions");
    return user?.activeSessions || [];
  },

  /**
   * Fetches the current active session ID of a user from the database.
   * @param {string} userId - The ID of the user to fetch the active session for.
   * @param {string} sessionId - The ID of the active session to fetch.
   * @returns {Promise<UserSession["sessionId"]>} - A promise that resolves with the current active session ID of the user.
   */
  async getCurrentSessionID(userId: string, sessionId: string) {
    const user = await User.findById(userId).select("activeSessions");
    const currentSessionID = user?.activeSessions.find(
      (session: UserSession) => session.sessionId === sessionId,
    )?.sessionId;

    return currentSessionID;
  },

  /**
   * Deletes a user by their ID.
   * @param {string} userId - The ID of the user to delete.
   * @returns {Promise<UserType | null>} - A promise that resolves with the deleted user if found, or null if not found.
   * @throws {Error} - If there was an error while deleting the user.
   */
  async deleteUserById(userId: string) {
    return await User.findOneAndDelete({ _id: userId });
  },
};

export default userService;
