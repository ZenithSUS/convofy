import { connectToDatabase } from "@/lib/mongodb";
import { pusherServer } from "@/lib/pusher";
import Message from "@/models/Message";
import { Message as IMessage } from "@/types/message";

export const sendLiveMessage = async (data: IMessage) => {
  try {
    await connectToDatabase();

    // Create the message
    const message = await Message.create(data);

    // Populate the sender information before sending to Pusher
    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "name")
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
    console.error("Error sending live message:", error);
    throw error;
  }
};
