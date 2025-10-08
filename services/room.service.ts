import { connectToDatabase } from "@/lib/mongodb";
import Room from "@/models/Room";
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
  let rooms = [];

  if (query !== "" && query !== undefined) {
    rooms = await Room.find({
      name: { $regex: query, $options: "i" },
      description: { $regex: query, $options: "i" },
    })
      .populate("lastMessage", "content")
      .populate("members", "name")
      .sort({ createdAt: -1 });
  } else {
    rooms = await Room.find()
      .populate("lastMessage", "content")
      .populate("members", "name")
      .sort({ createdAt: -1 });
  }

  return rooms || [];
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

export const getRoomsByUserId = async (
  userId: string,
  searchQuery: string = "",
) => {
  await connectToDatabase();

  let rooms = [];

  if (searchQuery !== "" && searchQuery !== undefined) {
    rooms = await Room.find({
      members: userId,
      name: { $regex: searchQuery, $options: "i" },
      description: { $regex: searchQuery, $options: "i" },
      isPrivate: false,
    })
      .populate("members", "name")
      .populate("lastMessage", "content")
      .sort({ createdAt: -1 });
  } else {
    rooms = await Room.find({
      members: userId,
      isPrivate: false,
    })
      .populate("members", "name")
      .populate("lastMessage", "content")
      .sort({ createdAt: -1 });
  }

  return rooms || [];
};
