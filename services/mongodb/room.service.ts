import { connectToDatabase } from "@/lib/mongodb";
import Room from "@/models/Room";
import { Room as IRoom } from "@/types/room";
import User from "@/models/User";
import "@/models/Message";
import { CreateRoom } from "@/types/room";
import { pusherServer } from "@/lib/pusher/pusher-server";
import Message from "@/models/Message";

export const roomService = {
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

    const channelName = `user-${data.owner}`;

    try {
      await pusherServer.trigger(channelName, "room-created", populatedRoom);
    } catch (error) {
      await Room.deleteOne({ _id: room._id });
      throw error;
    }

    return populatedRoom;
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

  async getRoomAndUsersById(id: string) {
    await connectToDatabase();
    const room = await Room.findById(id)
      .populate("members", [
        "name",
        "avatar",
        "isAvailable",
        "status",
        "anonAvatar",
        "anonAlias",
        "isAnonymous",
        "role",
      ])
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
   * Retrieves all rooms that the user is a member of, filtered by access rights.
   * Only shows: public rooms, accepted private rooms, or pending rooms created by the user.
   */
  async getUserRooms(userId: string, searchQuery?: string) {
    try {
      interface RoomQuery {
        members: string;
        name?: { $regex: string; $options: string };
        isAnonymous: boolean;
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
        isAnonymous: false,
        $or: [
          { isPrivate: false },
          { isPrivate: true, isAccepted: true, isPending: false },
          {
            isPrivate: true,
            isPending: true,
            isAccepted: false,
            invitedBy: userId,
          },
        ],
      };

      if (searchQuery) {
        query.name = { $regex: searchQuery, $options: "i" };
      }
      await connectToDatabase();
      const rooms = await Room.find(query)
        .populate("members", ["name", "avatar", "_id", "status", "isAvailable"])
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
   * Searches for public rooms and users (excluding current user) that match the query.
   */
  async getRoomsAndUsersBySearchQuery(userId: string, query: string) {
    await connectToDatabase();

    const [rooms, users] = await Promise.all([
      Room.find({ isPrivate: false, name: { $regex: query, $options: "i" } })
        .populate("members", ["name", "avatar", "_id", "status"])
        .populate("lastMessage", ["content", "type", "createdAt"])
        .sort({ createdAt: -1 })
        .lean(),

      User.find({
        _id: { $ne: userId },
        isAnonymous: false,
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
   * Creates a new private room or returns an existing one.
   * New rooms are created with pending status and trigger an invitation to the invited user.
   */
  async getOrCreatePrivateRoom(userIdA: string, userIdB: string) {
    await connectToDatabase();

    const sortedMembers = [userIdA, userIdB].sort();

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

    room = await Room.create({
      isPrivate: true,
      isPending: true,
      isAccepted: false,
      members: sortedMembers,
      owner: userIdA,
      invitedBy: userIdA,
      invitedUser: userIdB,
    });

    room = await Room.findById(room._id)
      .populate("members", ["name", "avatar", "_id", "status"])
      .populate("lastMessage", ["content", "type", "createdAt"])
      .populate("invitedBy", ["name", "avatar"])
      .lean();

    await pusherServer.trigger(`user-${userIdB}`, "room-invite-received", room);

    return room;
  },

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
   * Declines a room invitation and deletes all associated messages.
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

  async getUserJoinRoomIds(userId: string) {
    await connectToDatabase();
    const rooms = await Room.find({ members: userId }, { _id: 1 }).lean();
    return rooms;
  },

  async addMemberToRoom(roomId: string, userId: string) {
    await connectToDatabase();
    const room = await Room.findByIdAndUpdate(
      { _id: roomId },
      { $addToSet: { members: userId } },
      { new: true },
    )
      .populate("members", ["name", "avatar"])
      .populate("lastMessage", ["content", "type", "createdAt"]);

    const channelName = `user-${userId}`;
    pusherServer.trigger(channelName, "room-created", room);

    return room || null;
  },

  /**
   * Deletes a room and all associated messages.
   * @throws {Error} - If the room is not found or user is not the creator.
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

    await Message.deleteMany({ room: roomId });

    return room;
  },

  /**
   * Debugging utility: Drops and recreates room collection indexes.
   */
  async fixIndexes() {
    await connectToDatabase();

    try {
      const indexes = await Room.collection.indexes();
      console.log("Current indexes:", indexes);

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
      await Room.syncIndexes();
      console.log("Synced indexes successfully");
    } catch (error) {
      console.error("Error syncing indexes:", error);
    }
  },
};

export default roomService;
