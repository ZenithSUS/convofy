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

export const getRooms = async () => {
  await connectToDatabase();

  const rooms = await Room.find()
    .populate("lastMessage", "content")
    .sort({ createdAt: -1 });

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
    roomId,
    { $addToSet: { members: userId } },
    { new: true },
  );
  return room;
};
