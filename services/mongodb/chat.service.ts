import { connectToDatabase } from "@/lib/mongodb";
import { pusherServer } from "@/lib/pusher";
import Message from "@/models/Message";
import Room from "@/models/Room";
import { Message as IMessage } from "@/types/message";
import { RoomMembers } from "@/types/room";

export const chatService = {
  /**
   * Sends a live message to the specified room.
   * The message is saved to the database, and the room's last message is updated.
   * The message is then sent to Pusher with the populated sender information.
   * Finally, the room's last message is updated for all related members.
   * @param {Message} data - The message to send.
   * @returns {Promise<Message>} The populated message.
   * @throws {Error} If the message ID is empty, the message is not found, or the room is not found.
   */
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

  /**
   * Edits a live message by updating the content and sending the updated message to Pusher.
   * @param {string} id - The ID of the message to edit.
   * @param {string} content - The new content of the message.
   * @returns {Promise<Message>} The updated message with populated sender information.
   * @throws {Error} If the message ID is empty, the message is not found, or the room is not found.
   */
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

  /**
   * Deletes a live message from the database and updates the last message of the room and all related members.
   * @param {string} id - The ID of the message to delete.
   * @throws {Error} - If the message ID is empty, the message is not found, or the room is not found.
   * @returns {Promise<Message | null>} The deleted message, or null if no message was found.
   */
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

  /**
   * Fetches a room by its ID.
   * @param {string} id - The ID of the room to fetch.
   * @returns {Promise<Room>} The room with the given ID.
   */
  async findRoomById(id: string) {
    await connectToDatabase();
    const room = await Room.findById(id)
      .populate("members", ["name", "avatar", "_id", "status"])
      .populate("lastMessage", ["content", "type", "createdAt"])
      .lean();

    return room;
  },

  /**
   * Finds a message by its ID.
   * @param {string} messageId - The ID of the message to find.
   * @returns {Promise<Message | null>} A promise that resolves with the message if found, or null if not found.
   * @throws {Error} - If an error occurs while finding the message.
   */
  async findMessageById(messageId: string) {
    try {
      const message = await Message.findOne({
        _id: messageId,
      });
      return message;
    } catch (error) {
      console.error("Error finding message:", error);
      return null;
    }
  },
};

export default chatService;
