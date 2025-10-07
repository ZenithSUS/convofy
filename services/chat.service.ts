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

export const deleteLiveMessage = async (id: string) => {
  try {
    if (!id) throw new Error("Message ID is required");

    await connectToDatabase();

    // Delete the message
    const message = await Message.findByIdAndDelete(id);

    // Send to Pusher
    const channelName = `chat-${message?.room}`;
    await pusherServer.trigger(channelName, "delete-message", message);

    console.log("Message deleted:", message);

    return message;
  } catch (error) {
    console.error("Error deleting message:", error);
    throw error;
  }
};
