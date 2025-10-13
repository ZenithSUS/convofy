import { connectToDatabase } from "@/lib/mongodb";
import "@/models/User";
import Message from "@/models/Message";
import Room from "@/models/Room";

import { CreateMessage } from "@/types/message";
import { ObjectId } from "mongodb";

export const createMessage = async (data: CreateMessage) => {
  try {
    await connectToDatabase();

    if (!data.room) return new Error("Room is required");
    if (!data.sender) return new Error("Sender is required");

    const message = await Message.create({
      ...data,
      sender: new ObjectId(data.sender),
      createdAt: new Date(),
    });

    // Get the room and update the lastMessage field
    const room = await Room.findById(data.room);

    if (room) {
      await Room.updateOne({ _id: room._id }, { lastMessage: message._id });
      await room.save();
    }

    const newMessage = await Message.findById(message._id)
      .populate("sender", ["name", "avatar"])
      .exec();

    return newMessage;
  } catch (error) {
    console.error("Error creating message:", error);
    throw error;
  }
};

export const getMessagesByRoom = async (
  roomId: string,
  limit: number = 5,
  offset: number = 0,
) => {
  try {
    await connectToDatabase();

    const messages = await Message.find({ room: roomId })
      .limit(limit)
      .skip(offset)
      .populate("sender", ["name", "avatar"])
      .sort({ createdAt: -1 });

    return messages;
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
};

export const editMessage = async (messageId: string, content: string) => {
  try {
    await connectToDatabase();
    const editMessage = await Message.findOneAndUpdate(
      { _id: messageId },
      { content },
      { new: true },
    );

    if (!editMessage) {
      return new Error("Message not found");
    }

    await editMessage.save();

    const newEditedMessage = await Message.findById(editMessage._id)
      .populate("sender", ["name", "avatar"])
      .lean();

    return newEditedMessage;
  } catch (error) {}
};

export const deleteMessage = async (messageId: string) => {
  try {
    await connectToDatabase();
    const deletedMessage = await Message.findByIdAndDelete(messageId);
    return deletedMessage;
  } catch (error) {
    console.error("Error deleting message:", error);
    throw error;
  }
};
