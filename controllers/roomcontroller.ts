import { connectToDatabase } from "@/lib/mongodb";
import Room, { IRoom } from "@/models/Room";

export const createRoom = async (data: IRoom) => {
  await connectToDatabase();
  const room = await Room.create({
    ...data,
    createdAt: new Date(),
  });
  return room;
};

export const getRooms = async () => {
  await connectToDatabase();
  const rooms = await Room.find().sort({ createdAt: -1 });
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
