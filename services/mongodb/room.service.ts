import { connectToDatabase } from "@/lib/mongodb";
import Room from "@/models/Room";
import { Room as IRoom } from "@/types/room";
import User from "@/models/User";
import "@/models/Message";
import { CreateRoom } from "@/types/room";
import { pusherServer } from "@/lib/pusher-server";
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
    const channelName = `user-${data.owner}`;

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
  async findRoomById(id: string) {
    await connectToDatabase();
    const room = await Room.findById(id)
      .populate("members", ["name", "avatar", "_id", "status"])
      .populate({
        path: "lastMessage",
        select: "content type createdAt sender status.deliveredTo",
        populate: [
          {
            path: "status.seenBy",
            select: "name avatar _id",
          },
        ],
      })
      .lean();

    return room;
  },

  /**
   * Fetches a room by its ID.
   * @param {string} id - The ID of the room to fetch.
   * @returns {Promise<Room>} The room with the given ID.
   */
  async getRoomAndUsersById(id: string) {
    await connectToDatabase();
    const room = await Room.findById(id)
      .populate("members", ["name", "avatar", "isAvailable"])
      .populate({
        path: "lastMessage",
        select: "content type createdAt sender status.deliveredTo",
        populate: [
          {
            path: "status.seenBy",
            select: "name avatar _id",
          },
        ],
      })
      .lean();

    return room;
  },

  /**
   * Retrieves all rooms that the given user is a member of or owns, sorted by createdAt in descending order.
   * If a search query is provided, the rooms are filtered by the name of the room.
   * @param {string} userId - The ID of the user to fetch the rooms for.
   * @param {string} [searchQuery] - The query to filter the rooms by.
   * @returns {Promise<IRoom[]>} A promise that resolves with an array of rooms that the given user is a member of or owns.
   * @throws {Error} - If there was an error while fetching the rooms.
   */
  async getUserRooms(userId: string, searchQuery?: string) {
    try {
      interface RoomQuery {
        members: string;
        name?: { $regex: string; $options: string };
        $or: Array<
          | { isPrivate: boolean }
          | { isPrivate: boolean; isAccepted: boolean; isPending: boolean }
          | {
              isPrivate: boolean;
              isPending: boolean;
              isAccepted: boolean;
              invitedBy: string;
            }
        >;
      }

      const query: RoomQuery = {
        members: userId,
        $or: [
          { isPrivate: false }, // Public rooms
          { isPrivate: true, isAccepted: true, isPending: false }, // Accepted private rooms
          {
            isPrivate: true,
            isPending: true,
            isAccepted: false,
            invitedBy: userId, // Only show pending rooms to the inviter (userA)
          },
        ],
      };

      // Add search filter if provided
      if (searchQuery) {
        query.name = { $regex: searchQuery, $options: "i" };
      }

      const rooms = await Room.find(query)
        .populate("members", ["name", "avatar", "_id", "status"])
        .populate("lastMessage", [
          "content",
          "type",
          "createdAt",
          "sender",
          "status.seenBy",
          "status.deliveredTo",
        ])
        .sort({ createdAt: -1 })
        .lean<IRoom[]>();

      return rooms;
    } catch (error) {
      console.error("Error getting user rooms:", error);
      throw error;
    }
  },

  async findDirectRoom(members: string[]) {
    try {
      await connectToDatabase();
      const room = await Room.findOne({ members: { $all: members, $size: 2 } });
      return room;
    } catch (error) {
      console.error("Error finding direct room:", error);
      throw error;
    }
  },

  /**
   * Fetches the count of rooms that the user is a member of or owns.
   * @param {string} userId - The ID of the user to fetch the room count for.
   * @returns {Promise<number>} The count of rooms that the user is a member of or owns.
   */
  async getUserRoomCount(userId: string): Promise<number> {
    try {
      const count = await Room.countDocuments({
        $or: [{ owner: userId }, { members: userId }],
      });

      return count;
    } catch (error) {
      console.error("Error getting user room count:", error);
      return 0;
    }
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

    // Check if the room already exists (accepted or pending)
    let room = await Room.findOne({
      isPrivate: true,
      members: { $all: sortedMembers, $size: 2 },
    })
      .populate("members", ["name", "avatar", "_id", "status"])
      .populate("lastMessage", ["content", "type", "createdAt"])
      .populate("invitedBy", ["name", "avatar"])
      .lean();

    if (room) {
      return room;
    }

    // Create a new private room with pending status
    room = await Room.create({
      isPrivate: true,
      isPending: true,
      isAccepted: false,
      members: sortedMembers,
      owner: userIdA,
      invitedBy: userIdA,
      invitedUser: userIdB,
    });

    // Populate the newly created room
    room = await Room.findById(room._id)
      .populate("members", ["name", "avatar", "_id", "status"])
      .populate("lastMessage", ["content", "type", "createdAt"])
      .populate("invitedBy", ["name", "avatar"])
      .lean();

    // Send invitation notification to userB only
    await pusherServer.trigger(`user-${userIdB}`, "room-invite-received", room);

    return room;
  },

  /**
   * Retrieves all pending room invitations for the given user.
   * @param {string} userId - The ID of the user to fetch the pending invitations for.
   * @returns {Promise<Room[]>} An array of pending room invitations for the given user.
   */
  async getPendingInvitesByUserId(userId: string) {
    await connectToDatabase();
    const pendingInvites = await Room.find({
      isPending: true,
      isPrivate: true,
      isAccepted: false,
      invitedUser: userId,
    })

      .populate("invitedBy", ["_id", "name", "avatar"])
      .populate("lastMessage", ["content", "type", "createdAt"])
      .sort({ createdAt: -1 })
      .select([
        "-members",
        "-owner",
        "-isAccepted",
        "-isPrivate",
        "-isPending",
        "-description",
        "-name",
      ])
      .lean();

    return pendingInvites;
  },

  /**
   * Retrieves a single pending room invitation by the given room ID.
   * @param {string} roomId - The ID of the room to fetch the pending invitation for.
   * @returns {Promise<Room>} A single pending room invitation for the given room ID.
   */
  async getSinglePendingInvite(roomId: string) {
    await connectToDatabase();
    const pendingInvites = await Room.findById(roomId)
      .populate("invitedBy", ["name", "avatar"])
      .populate("lastMessage", ["content", "type", "createdAt"])
      .sort({ createdAt: -1 })
      .select([
        "-members",
        "-owner",
        "-isAccepted",
        "-isPrivate",
        "-isPending",
        "-description",
      ]);

    return pendingInvites;
  },

  /**
   * Retrieves all pending room invitations from the database.
   * @returns {Promise<Room[]>} An array of all pending room invitations.
   */
  async getAllPendingInvites() {
    await connectToDatabase();
    const pendingInvites = await Room.find({
      isPending: true,
      isPrivate: true,
      isAccepted: false,
    })
      .populate("invitedBy", ["name", "avatar"])
      .populate("lastMessage", ["content", "type", "createdAt"])
      .sort({ createdAt: -1 })
      .select([
        "-members",
        "-owner",
        "-isAccepted",
        "-isPrivate",
        "-isPending",
        "-description",
      ])
      .lean();

    return pendingInvites;
  },

  /**
   * Accepts a pending room invitation and updates the room status to "accepted".
   * @param {string} roomId - The ID of the room to accept the invitation for.
   * @param {string} userId - The ID of the user accepting the invitation.
   * @returns {Promise<Room>} The updated room.
   */
  async acceptRoomInvite(roomId: string, userId: string) {
    await connectToDatabase();
    const room = await Room.findByIdAndUpdate(
      {
        _id: roomId,
        isPending: true,
        isPrivate: true,
        isAccepted: false,
      },
      {
        $set: {
          isPending: false,
          isAccepted: true,
        },
      },
    )
      .populate("members", ["name", "avatar", "_id", "status"])
      .populate("lastMessage", ["content", "type", "createdAt"]);

    if (room) {
      await room.save();
    }

    await pusherServer.trigger(`user-${userId}`, "room-accepted", room);

    return room;
  },

  /**
   * Declines a pending room invitation.
   * If the room is not found, an error is thrown.
   * After declining the room, all messages in the room are also deleted.
   * @param {string} userId - The ID of the user declining the invitation.
   * @param {string} roomId - The ID of the room to decline the invitation for.
   * @returns {Promise<Room | null>} The deleted room, or null if no room was found.
   * @throws {Error} - If the room is not found.
   */
  async declineRoomInvite(userId: string, roomId: string) {
    await connectToDatabase();
    const room = await Room.findOneAndDelete({
      _id: roomId,
      invitedUser: userId,
      isPending: true,
      isPrivate: true,
    });

    await Message.deleteMany({ room: roomId });

    return room;
  },

  /**
   * Fetches an array of room IDs that the user is a member of.
   * @param {string} userId - The ID of the user to fetch the room IDs for.
   * @returns {Promise<Room[]>} An array of room IDs that the user is a member of.
   */
  async getUserJoinRoomIds(userId: string) {
    await connectToDatabase();
    const rooms = await Room.find({ members: userId }, { _id: 1 }).lean();
    return rooms;
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
    )
      .populate("members", ["name", "avatar"])
      .populate("lastMessage", ["content", "type", "createdAt"]);

    // Trigger pusher event to set new rooms to the user
    const channelName = `user-${userId}`;
    pusherServer.trigger(channelName, "room-created", room);

    return room || null;
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
