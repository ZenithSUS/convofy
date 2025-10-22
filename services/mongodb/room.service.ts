import { connectToDatabase } from "@/lib/mongodb";
import Room from "@/models/Room";
import User from "@/models/User";
import "@/models/Message";
import { CreateRoom } from "@/types/room";

export const roomService = {
  async createRoom(data: CreateRoom) {
    await connectToDatabase();

    const room = await Room.create({
      ...data,
      createdAt: new Date(),
    });

    return room;
  },

  async getRooms(query: string = "") {
    await connectToDatabase();

    const filter = query
      ? {
          $or: [
            { name: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
          ],
        }
      : {};

    const rooms = await Room.find(filter)
      .populate("lastMessage", ["content", "type", "createdAt"])
      .populate("members", ["name", "avatar", "_id", "status"])
      .sort({ createdAt: -1 })
      .lean();

    return rooms;
  },

  async getRoomAndUsersById(id: string) {
    await connectToDatabase();
    const room = await Room.findById(id).populate("members", [
      "name",
      "avatar",
    ]);

    return room;
  },

  async getRoomsAndUsersBySearchQuery(userId: string, query: string) {
    await connectToDatabase();

    const [rooms, users] = await Promise.all([
      // Search for rooms
      Room.find({ isPrivate: false, name: { $regex: query, $options: "i" } })
        .populate("members", ["name", "avatar", "_id", "status"])
        .populate("lastMessage", ["content", "type", "createdAt"])
        .sort({ createdAt: -1 })
        .lean(),

      // Exclude the current user from the search results
      User.find({
        _id: { $ne: userId },
        name: { $regex: query, $options: "i" },
      })
        .select(["name", "avatar", "status _id"])
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const results = [
      ...rooms.map((room) => ({ ...room, type: "room" })),
      ...users.map((user) => ({ ...user, type: "user" })),
    ];

    return results;
  },

  async getOrCreatePrivateRoom(userIdA: string, userIdB: string) {
    await connectToDatabase();

    // Sort the members to ensure consistent order
    const sortedMembers = [userIdA, userIdB].sort();

    // Check if the room already exists
    let room = await Room.findOne({
      isPrivate: true,
      members: { $all: sortedMembers, $size: 2 },
    })
      .populate("members", ["name", "avatar"])
      .populate("lastMessage", ["content", "type", "createdAt"]);

    if (!room) {
      // Create a new private room with sorted members
      room = await Room.create({
        isPrivate: true,
        members: sortedMembers,
        createdBy: userIdA,
      });

      // Populate the newly created room
      room = await Room.findById(room._id)
        .populate("members", ["name", "avatar"])
        .populate("lastMessage", ["content", "type", "createdAt"]);
    }

    return room;
  },
  async addMemberToRoom(roomId: string, userId: string) {
    await connectToDatabase();
    const room = await Room.findByIdAndUpdate(
      { _id: roomId },
      { $addToSet: { members: userId } },
      { new: true },
    );
    return room || null;
  },

  async getRoomsAndUsersByUserId(userId: string) {
    await connectToDatabase();

    const rooms = await Room.find({
      members: userId,
    })
      .populate("members", ["name", "avatar", "_id", "status"])
      .populate("lastMessage", ["content", "type", "sender", "createdAt"])
      .sort({ createdAt: -1 })
      .lean();

    return rooms || [];
  },

  async fixIndexes() {
    await connectToDatabase();

    try {
      const indexes = await Room.collection.indexes();
      console.log("Current indexes:", indexes);

      // Drop the problematic indexes
      await Room.collection.dropIndex("members_1");
      console.log("Dropped members_1");
    } catch (error) {
      console.error("Error dropping index:", error);
      console.log("members_1 doesn't exist or already dropped");
    }

    try {
      await Room.collection.dropIndex("members_1_isPrivate_1");
      console.log("Dropped members_1_isPrivate_1");
    } catch (error) {
      console.error("Error dropping index:", error);
      console.log("members_1_isPrivate_1 doesn't exist or already dropped");
    }

    try {
      // Recreate the correct indexes
      await Room.syncIndexes();
      console.log("Synced indexes successfully");
    } catch (error) {
      console.error("Error syncing indexes:", error);
    }
  },
};

export default roomService;
