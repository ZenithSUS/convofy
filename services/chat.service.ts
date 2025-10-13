import { connectToDatabase } from "@/lib/mongodb";
import { pusherServer } from "@/lib/pusher";
import Message from "@/models/Message";
import Room from "@/models/Room";
import { Message as IMessage } from "@/types/message";

export const sendLiveMessage = async (data: IMessage) => {
  try {
    await connectToDatabase();

    // Create the message
    const message = await Message.create(data);

    const room = await Room.findById(data.room);

    if (room) {
      await Room.updateOne({ _id: room._id }, { lastMessage: message._id });
      await room.save();
    }

    // Populate the sender information before sending to Pusher
    const populatedMessage = await Message.findById(message._id)
      .populate("sender", ["name", "avatar"])
      .lean();

    if (!populatedMessage) {
      throw new Error("Failed to retrieve created message");
    }

    // Send to Pusher with populated data
    const channelName = `chat-${data.room}`;
    await pusherServer.trigger(channelName, "new-message", populatedMessage);

    // Return the populated message
    return populatedMessage;
  } catch (error) {
    throw error;
  }
};

export const editLiveMessage = async (id: string, content: string) => {
  try {
    await connectToDatabase();
    const editMessage = await Message.findOneAndUpdate(
      { _id: id },
      { content: content },
      { new: true },
    );

    // Populate the sender information before sending to Pusher
    if (!editMessage) {
      return new Error("Message not found");
    }

    // Update the message
    await editMessage.save();

    // Return the populated message
    const newEditedMessage = await Message.findById(editMessage._id)
      .populate("sender", ["name", "avatar"])
      .lean();

    // Send to Pusher
    const channelName = `chat-${editMessage.room}`;
    await pusherServer.trigger(channelName, "edit-message", newEditedMessage);

    return newEditedMessage;
  } catch (error) {
    throw error;
  }
};

export const deleteLiveMessage = async (id: string) => {
  try {
    if (!id) throw new Error("Message ID is required");

    await connectToDatabase();

    // Delete the message
    const message = await Message.findByIdAndDelete(id);

    // Update the last message if the delete message is on the last one
    const lastMessage = await Message.findOne({ room: message?.room }).sort({
      createdAt: -1,
    });

    // Update the last message if the delete message is on the last one
    if (lastMessage) {
      await Room.updateOne(
        { _id: message?.room },
        { lastMessage: lastMessage._id },
      );
      await lastMessage.save();
    }

    // Send to Pusher
    const channelName = `chat-${message?.room}`;

    await pusherServer.trigger(channelName, "delete-message", message);

    return message;
  } catch (error) {
    throw error;
  }
};
