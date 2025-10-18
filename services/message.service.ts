import { connectToDatabase } from "@/lib/mongodb";
import "@/models/User";
import Message from "@/models/Message";
import Room from "@/models/Room";

import { CreateMessage } from "@/types/message";
import { ObjectId } from "mongodb";
import { Types } from "mongoose";

/**
 * This function creates a new message
 * @param data
 * @returns A new created message
 */
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

/**
 * This function gets messages by room that are paginated
 * @param roomId
 * @param limit
 * @param offset
 * @returns An array of messages or an error
 */
export const getMessages = async (
  roomId: string,
  limit: number,
  offset: number,
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
    throw error;
  }
};

/**
 * This function gets messages by room that are paginated
 * and sorted by createdAt
 * @param roomId
 * @param limit
 * @param offset
 * @returns An array of messages or an error
 */
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
    throw error;
  }
};

/**
 * This function gets messages by user filtering by type
 * @param userId
 * @param limit
 * @returns messages of type image and file or an error
 */
export const getMessagesByUserAndFileType = async (
  userId: string,
  limit: number,
  offset: number,
) => {
  try {
    await connectToDatabase();

    // Validate userId first
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid userId");
    }

    const userIdObject = new Types.ObjectId(userId);

    // Query messages where sender matches userId AND type is image or file
    const messages = await Message.find({
      sender: userIdObject,
      type: { $in: ["image", "file"] },
    })
      .limit(limit)
      .skip(offset)
      .populate("sender", "name")
      .sort({ createdAt: -1 });

    return messages;
  } catch (error) {
    throw error;
  }
};

/**
 * This function edits a message
 * @param messageId
 * @param content
 * @returns
 */
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
  } catch (error) {
    throw error;
  }
};

/**
 * This function deletes a message
 * @param messageId
 * @returns deleted message
 */
export const deleteMessage = async (messageId: string) => {
  try {
    await connectToDatabase();
    const deletedMessage = await Message.findByIdAndDelete(messageId);
    return deletedMessage;
  } catch (error) {
    throw error;
  }
};
