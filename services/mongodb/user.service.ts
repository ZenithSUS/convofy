import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { UserDataStats, User as UserType } from "@/types/user";
import Message from "@/models/Message";
import Room from "@/models/Room";
import { pusherServer } from "@/lib/pusher";

export const userService = {
  async createUser(data: UserType) {
    await connectToDatabase();
    const user = await User.create(data);
    return user;
  },

  async getUsers() {
    await connectToDatabase();
    const users = await User.find({}, "-password").sort({ createdAt: -1 });
    return users;
  },

  async getUserById(id: string) {
    await connectToDatabase();
    const user = await User.findById(id, "-password");
    return user;
  },

  async getUserByEmail(email: string): Promise<UserType | null> {
    await connectToDatabase();
    const user = await User.findOne({ email }, "-password");
    return user;
  },

  async getUserDataStats(userId: string) {
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

      const data: UserDataStats = { messages, medias, contacts: rooms };

      return data;
    } catch (error) {
      throw error;
    }
  },

  async updateUserStatus(id: string, status: "online" | "offline") {
    await connectToDatabase();
    const user = await User.findOneAndUpdate(
      { _id: id },
      { status, lastActive: new Date() },
      { new: true, fields: "-password" },
    );
    return user;
  },

  async updateLiveUserStatus(id: string, status: "online" | "offline") {
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
};

export default userService;
