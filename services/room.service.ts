import { connectToDatabase } from "@/lib/mongodb";
import Room from "@/models/Room";
import "@/models/User";
import "@/models/Message";
import { CreateRoom } from "@/types/room";

export const createRoom = async (data: CreateRoom) => {
  await connectToDatabase();

  const room = await Room.create({
    ...data,
    createdAt: new Date(),
  });

  return room;
};

export const getRooms = async (query: string = "") => {
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
    .populate("lastMessage", ["content", "type"])
    .populate("members", ["name", "avatar"])
    .sort({ createdAt: -1 })
    .lean();

  return rooms;
};

export const getRoomById = async (id: string) => {
  await connectToDatabase();
  const room = await Room.findById(id);
  return room;
};

export const addMemberToRoom = async (roomId: string, userId: string) => {
  await connectToDatabase();
  const room = await Room.findByIdAndUpdate(
    { _id: roomId },
    { $addToSet: { members: userId } },
    { new: true },
  );
  return room || null;
};

export const getRoomsByUserId = async (userId: string) => {
  await connectToDatabase();

  const rooms = await Room.find({
    members: userId,

    isPrivate: false,
  })
    .populate("members", ["name", "avatar"])
    .populate("lastMessage", ["content", "type", "sender"])
    .sort({ createdAt: -1 })
    .lean();

  return rooms || [];
};
