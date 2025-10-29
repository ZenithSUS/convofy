import { connectToDatabase } from "@/lib/mongodb";
import { pusherServer } from "@/lib/pusher";
import Message from "@/models/Message";
import Room from "@/models/Room";
import { Message as IMessage } from "@/types/message";
import { RoomMembers } from "@/types/room";

export const chatService = {
  async sendLiveMessage(data: IMessage) {
    try {
      await connectToDatabase();

      // Create the message
      const message = await Message.create(data);

      const room = await Room.findById(data.room).populate("members", [
        "avatar",
        "_id",
        "status",
        "name",
      ]);

      if (room) {
        await Room.updateOne({ _id: room._id }, { lastMessage: message._id });
        await room.save();
      }

      // Get the new last message
      const lastMessage = await Message.findById(message._id)
        .populate("sender", ["name", "avatar"])
        .lean();

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

      // Update the room last message of all related members
      if (room?.members && room.members.length > 0) {
        const roomContentData = {
          _id: room._id.toString(),
          members: room.members as unknown as RoomMembers[],
          name: room.isPrivate ? undefined : room.name,
          description: room.isPrivate ? undefined : room.description,
          lastMessage: lastMessage,
          isPrivate: room.isPrivate,
          image: room.isPrivate ? undefined : room.image,
        };

        const pusherPromises = (room.members as unknown as RoomMembers[]).map(
          (member) => {
            const memberId = member._id.toString();

            return pusherServer.trigger(
              `user-${memberId}`,
              "room-updated",
              roomContentData,
            );
          },
        );

        await Promise.all(pusherPromises);
      }

      // Return the populated message
      return populatedMessage;
    } catch (error) {
      throw error;
    }
  },

  async editLiveMessage(id: string, content: string) {
    try {
      await connectToDatabase();
      const editMessage = await Message.findOneAndUpdate(
        { _id: id },
        { content: content, isEdited: true },
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

      // Update the room last message of all related members
      const room = await Room.findById(editMessage.room).populate("members", [
        "avatar",
        "_id",
        "status",
        "name",
      ]);

      // Check if the room exists
      if (!room) throw new Error("Room not found");

      const roomContentData = {
        _id: room._id.toString(),
        members: room.members as unknown as RoomMembers[],
        name: room.isPrivate ? undefined : room.name,
        description: room.isPrivate ? undefined : room.description,
        lastMessage: newEditedMessage,
        isPrivate: room.isPrivate,
        image: room.isPrivate ? undefined : room.image,
      };

      const pusherPromises = (room.members as unknown as RoomMembers[]).map(
        (member) => {
          const memberId = member._id.toString();

          return pusherServer.trigger(
            `user-${memberId}`,
            "room-updated",
            roomContentData,
          );
        },
      );

      await Promise.all(pusherPromises);

      return newEditedMessage;
    } catch (error) {
      throw error;
    }
  },

  async deleteLiveMessage(id: string) {
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

      // Update the room last message of all related members
      const room = await Room.findById(message?.room).populate("members", [
        "avatar",
        "_id",
        "status",
        "name",
      ]);

      // Check if the room exists
      if (!room) throw new Error("Room not found");

      const roomContentData = {
        _id: room._id.toString(),
        members: room.members as unknown as RoomMembers[],
        name: room.isPrivate ? undefined : room.name,
        description: room.isPrivate ? undefined : room.description,
        lastMessage: lastMessage,
        isPrivate: room.isPrivate,
        image: room.isPrivate ? undefined : room.image,
      };

      // Update the room last message of all related members
      const pusherPromises = (room.members as unknown as RoomMembers[]).map(
        (member) => {
          const memberId = member._id.toString();
          return pusherServer.trigger(
            `user-${memberId}`,
            "room-updated",
            roomContentData,
          );
        },
      );

      // Update at the same time
      await Promise.all(pusherPromises);

      return message;
    } catch (error) {
      throw error;
    }
  },
};

export default chatService;
