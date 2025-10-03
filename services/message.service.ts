import { connectToDatabase } from "@/lib/mongodb";
import Message, { IMessage } from "@/models/Message";

export const createMessage = async (data: IMessage) => {
  await connectToDatabase();
  const message = await Message.create({
    ...data,
    createdAt: new Date(),
  });
  return message;
};

export const getMessagesByRoom = async (roomId: string) => {
  await connectToDatabase();
  const messages = await Message.find({ room: roomId }).sort({ createdAt: -1 });
  return messages;
};
