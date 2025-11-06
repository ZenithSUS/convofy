import { connectToDatabase } from "@/lib/mongodb";
import Room from "@/models/Room";
import User from "@/models/User";
import "@/models/Message";
import { CreateRoom } from "@/types/room";
import { pusherServer } from "@/lib/pusher";
import Message from "@/models/Message";

export const roomService = {
  /**
   * Creates a new room in the database
   * @param {CreateRoom} data - The data to create the room with
   * @returns {Promise<Room>} The newly created room
   */
  async createRoom(data: CreateRoom) {
    await connectToDatabase();

    const room = await Room.create({
      ...data,
      createdAt: new Date(),
    });

    const populatedRoom = await Room.findById(room._id)
      .populate("lastMessage", ["content", "type", "createdAt"])
      .populate("members", ["name", "avatar", "_id", "status"])
      .lean();

    // Send new room event to Pusher
    const channelName = `user-${data.createdBy}`;

    try {
      await pusherServer.trigger(channelName, "room-created", populatedRoom);
    } catch (error) {
      await Room.deleteOne({ _id: room._id });
      throw error;
    }

    return populatedRoom;
  },

  /**
   * Fetches all rooms in the database that match the given query.
   * @param {string} [query] - The query to filter the rooms by.
   * @returns {Promise<Room[]>} The rooms that match the query.
   */
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

  /**
   * Fetches a room by its ID.
   * @param {string} id - The ID of the room to fetch.
   * @returns {Promise<Room>} The room with the given ID.
   */
  async getRoomAndUsersById(id: string) {
    await connectToDatabase();
    const room = await Room.findById(id).populate("members", [
      "name",
      "avatar",
    ]);

    return room;
  },

  /**
   * Searches for rooms and users by name that match the given query.
   * Excludes the current user from the search results.
   * @param {string} userId - The ID of the current user.
   * @param {string} query - The query to filter the rooms and users by.
   * @returns {Promise<{type: 'room' | 'user', ...Room | ...User}[]>} An array of rooms and users that match the query.
   */
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

  /**
   * Creates a new private room in the database if it doesn't already exist,
   * or fetches an existing private room with the given members.
   * The members are sorted to ensure consistent order.
   * @param {string} userIdA - The ID of the first user.
   * @param {string} userIdB - The ID of the second user.
   * @returns {Promise<Room>} The newly created or existing private room.
   */
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

      // Send new room event to both users
      await Promise.all([
        pusherServer.trigger(`user-${userIdA}`, "room-created", room),
        pusherServer.trigger(`user-${userIdB}`, "room-created", room),
      ]);
    }

    return room;
  },

  /**
   * Adds a new member to an existing room if the room doesn't already contain the given user.
   * @param {string} roomId - The ID of the room to add the member to.
   * @param {string} userId - The ID of the user to add to the room.
   * @returns {Promise<Room | null>} The updated room, or null if no room was found.
   */
  async addMemberToRoom(roomId: string, userId: string) {
    await connectToDatabase();
    const room = await Room.findByIdAndUpdate(
      { _id: roomId },
      { $addToSet: { members: userId } },
      { new: true },
    ).populate("members", ["name", "avatar"]);

    return room || null;
  },

  /**
   * Fetches all rooms that the given user is a member of, sorted by createdAt in descending order.
   * If no rooms are found, an empty array is returned.
   * @param {string} userId - The ID of the user to fetch rooms for.
   * @returns {Promise<Room[]>} A promise that resolves with an array of rooms that the given user is a member of.
   */
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

  /**
   * Deletes a room by its ID if the room was created by the given user.
   * If the room is not found, an error is thrown.
   * After deleting the room, all messages in the room are also deleted.
   * @param {string} userId - The ID of the user who created the room.
   * @param {string} roomId - The ID of the room to delete.
   * @returns {Promise<Room | null>} The deleted room, or null if no room was found.
   * @throws {Error} - If the room is not found.
   */
  async deleteRoomById(userId: string, roomId: string) {
    await connectToDatabase();

    const room = await Room.findOneAndDelete({
      _id: roomId,
      createdBy: userId,
    });

    if (!room) {
      throw new Error("Room not found");
    }

    const channelName = `user-${userId}`;

    await pusherServer.trigger(channelName, "room-deleted", roomId);

    // Delete all messages in the room
    await Message.deleteMany({ room: roomId });

    return room;
  },

  /**
   * Drops the problematic indexes from the Room collection and recreates the correct ones.
   * Useful for debugging purposes when the indexes become corrupted.
   * @returns {Promise<void>} A promise that resolves when the indexes have been fixed.
   */
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
