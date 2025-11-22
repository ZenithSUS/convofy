import { connectToDatabase } from "@/lib/mongodb";
import "@/models/User";
import Message from "@/models/Message";
import Room from "@/models/Room";

import { CreateMessage } from "@/types/message";
import { ObjectId } from "mongodb";
import { Types } from "mongoose";
import { pusherServer } from "@/lib/pusher/pusher-server";
import User from "@/models/User";

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

export const getMessagesByUserId = async (
  userId: string,
  limit: number,
  offset: number,
) => {
  try {
    await connectToDatabase();
    const messages = await Message.find({ sender: userId })
      .limit(limit)
      .skip(offset)
      .populate("room", ["name", "avatar", "members", "isPrivate"])
      .populate("sender", ["name", "avatar"])
      .sort({ createdAt: -1 })
      .lean();

    return messages;
  } catch (error) {
    throw error;
  }
};

export const getMessagesByUserIdAndQuery = async (
  userId: string,
  query: string,
  limit: number,
  offset: number,
) => {
  try {
    await connectToDatabase();
    const messages = await Message.find({
      sender: userId,
      type: "text",
      $or: [{ content: { $regex: query, $options: "i" } }],
    })
      .limit(limit)
      .skip(offset)
      .populate("room", ["name", "avatar", "members", "isPrivate"])
      .populate("sender", ["name", "avatar"])
      .sort({ createdAt: -1 })
      .lean();

    return messages;
  } catch (error) {
    throw error;
  }
};

export const findMessageById = async (messageId: string) => {
  try {
    const message = await Message.findOne({
      _id: messageId,
    });
    return message;
  } catch (error) {
    console.error("Error finding message:", error);
    return null;
  }
};

/**
 * Retrieves messages for a room, marks them as seen by the user, and broadcasts the seen status via Pusher.
 */
export const getMessagesByRoom = async (
  userId: string,
  roomId: string,
  limit: number = 5,
  offset: number = 0,
) => {
  try {
    await connectToDatabase();

    const messages = await Message.find({ room: roomId })
      .limit(limit)
      .skip(offset)
      .populate("sender", [
        "name",
        "avatar",
        "anonAvatar",
        "anonAlias",
        "isAnonymous",
      ])
      .populate("status.seenBy", [
        "_id",
        "name",
        "avatar",
        "isAnonymous",
        "anonAvatar",
        "anonAlias",
        "role",
      ])
      .populate("room", "isAnonymous")
      .sort({ createdAt: -1 });

    if (!messages) return new Error("No messages found");

    await Message.updateMany(
      { room: roomId, sender: { $ne: userId } },
      { $addToSet: { "status.seenBy": userId } },
    );

    const roomChannel = `presence-chat-${roomId}`;
    const response = await pusherServer.get({
      path: `/channels/${roomChannel}/users`,
    });

    const { users }: { users: { id: string }[] } = await response.json();
    const onlineUserIds = users.map((user) => user.id);

    const onlineUsers = await User.find(
      { _id: { $in: onlineUserIds } },
      {
        _id: 1,
        name: 1,
        avatar: 1,
        isAnonymous: 1,
        anonAvatar: 1,
        anonAlias: 1,
        role: 1,
      },
    );

    if (messages.length > 0) {
      await pusherServer.trigger(roomChannel, "update-seen-by", {
        messageId: messages[0]._id,
        seenBy: onlineUsers,
      });
    }

    await pusherServer.trigger(`user-${userId}`, "message-seen", {
      roomId,
      userId,
    });

    return messages;
  } catch (error) {
    throw error;
  }
};

export const getMessagesByUserAndFileType = async (
  userId: string,
  limit: number,
  offset: number,
  fileType?: string,
) => {
  try {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid userId");
    }

    const userIdObject = new Types.ObjectId(userId);

    const query = fileType
      ? { sender: userIdObject, type: fileType }
      : {
          sender: userIdObject,
          type: { $in: ["image", "file"] },
        };

    const messages = await Message.find(query)
      .limit(limit)
      .skip(offset)
      .populate("sender", "name")
      .sort({ createdAt: -1 });

    return messages;
  } catch (error) {
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
  } catch (error) {
    throw error;
  }
};

export const deleteMessage = async (messageId: string) => {
  try {
    await connectToDatabase();
    const deletedMessage = await Message.findByIdAndDelete(messageId);
    return deletedMessage;
  } catch (error) {
    throw error;
  }
};
