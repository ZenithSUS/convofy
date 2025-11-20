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
import { pusherServer } from "@/lib/pusher/pusher-server";
import bcrypt from "bcrypt";
import anonymousName from "@/helper/anonymous-name";
import generateAnonymousAvatar from "@/helper/anonymous-avatar";

export const userService = {
  async createUser(data: UserType): Promise<UserType> {
    try {
      await connectToDatabase();
      const user = await User.create(data);
      return user;
    } catch (error) {
      throw error;
    }
  },

  async getUsers(): Promise<UserType[]> {
    try {
      await connectToDatabase();
      const users = await User.find({}, "-password").sort({ createdAt: -1 });
      return users;
    } catch (error) {
      throw error;
    }
  },

  async getUserById(
    id: string,
    excludePassword = true,
  ): Promise<UserType | null> {
    await connectToDatabase();
    const user = await User.findById(id, excludePassword ? "-password" : "");
    return user;
  },

  async getUserByEmail(email: string): Promise<UserType | null> {
    await connectToDatabase();
    const user = await User.findOne({ email }, "-password");
    return user;
  },

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

  async updatePassword(id: string, newPassword: string): Promise<boolean> {
    try {
      await connectToDatabase();
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const user = await User.findOneAndUpdate(
        { _id: id },
        { password: hashedPassword },
        { new: true, fields: "-password" },
      );
      return !!user;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Changes the password of a user by first verifying the current password.
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

  async updateUserPreferences(
    id: string,
    isAnonymous: boolean,
    preferences: Partial<UserType["preferences"]>,
  ): Promise<UserType | null> {
    try {
      const anonName = anonymousName();
      const setAnonymous = {
        anonAlias: anonName,
        anonAvatar: generateAnonymousAvatar(anonName),
      };
      await connectToDatabase();
      const user = await User.findOneAndUpdate(
        { _id: id },
        {
          $set: { preferences: preferences },
          isAnonymous: isAnonymous,
          ...(isAnonymous
            ? setAnonymous
            : { anonAlias: null, anonAvatar: null }),
        },
        { new: true, fields: "-password" },
      );

      return user;
    } catch (error) {
      throw error;
    }
  },

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
   * Updates user status and broadcasts the change via Pusher.
   */
  async updateLiveUserStatus(
    id: string,
    status: "online" | "offline",
  ): Promise<UserType | null> {
    await connectToDatabase();
    const user = await User.findOneAndUpdate(
      { _id: id },
      { status, lastActive: new Date() },
      { new: true },
    ).select("status");

    const channelName = `user-${id}`;

    await pusherServer.trigger(
      channelName,
      "status-update",
      user.status as string,
    );

    return user;
  },

  /**
   * Links OAuth credentials to an existing user account.
   * @throws {Error} - If the email is already registered.
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

  async replaceCredentialProvider(
    accountId: string,
    account: Partial<UserLinkedAccount>,
  ) {
    try {
      await connectToDatabase();

      const user = await User.findOneAndUpdate(
        {
          _id: accountId,
          "linkedAccounts.providerAccountId": accountId,
        },
        {
          $set: {
            "linkedAccounts.$.provider": account.provider,
            "linkedAccounts.$.providerAccount": account.providerAccount,
            "linkedAccounts.$.providerAccountId": account.providerAccountId,
          },
        },
        {
          new: true,
          projection: "-password",
        },
      );

      return user;
    } catch (error) {
      throw error;
    }
  },

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

  async addUserSession(userId: string, session: UserSession) {
    await connectToDatabase();
    return await User.findByIdAndUpdate(
      userId,
      {
        $push: { activeSessions: session },
        $set: { lastActive: new Date() },
      },
      { new: true },
    );
  },

  async updateSessionActivity(userId: string, sessionId: string) {
    await connectToDatabase();
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

  async revokeSession(userId: string, sessionId: string) {
    await connectToDatabase();
    return await User.findByIdAndUpdate(
      { _id: userId },
      { $pull: { activeSessions: { sessionId } } },
      { new: true },
    );
  },

  async revokeAllSessions(userId: string, exceptSessionId?: string) {
    await connectToDatabase();
    const update = exceptSessionId
      ? { $pull: { activeSessions: { sessionId: { $ne: exceptSessionId } } } }
      : { $set: { activeSessions: [] } };

    return await User.findByIdAndUpdate(userId, update, { new: true });
  },

  /**
   * Removes all expired sessions from all users.
   * Should be run as a cron job.
   */
  async cleanExpiredSessions() {
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

  async getUserActiveSessions(userId: string) {
    await connectToDatabase();
    const user = await User.findById(userId).select("activeSessions");
    return user?.activeSessions || [];
  },

  async getCurrentSessionID(userId: string, sessionId: string) {
    await connectToDatabase();
    const user = await User.findById(userId).select("activeSessions");
    const currentSessionID = user?.activeSessions.find(
      (session: UserSession) => session.sessionId === sessionId,
    )?.sessionId;

    return currentSessionID;
  },

  async deleteUserById(userId: string) {
    await connectToDatabase();
    return await User.findOneAndDelete({ _id: userId });
  },

  async verifyPassword(userId: string, password: string): Promise<boolean> {
    await connectToDatabase();
    const user = await User.findById(userId).select("password");
    if (!user) return false;

    return await bcrypt.compare(password, user.password);
  },
};

export default userService;
