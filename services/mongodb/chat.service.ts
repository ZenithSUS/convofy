import { connectToDatabase } from "@/lib/mongodb";
import { pusherServer } from "@/lib/pusher/pusher-server";
import Message from "@/models/Message";
import Room from "@/models/Room";
import { Message as IMessage } from "@/types/message";
import { RoomMembers } from "@/types/room";
import roomService from "./room.service";
import User from "@/models/User";

export const chatService = {
  /**
   * Sends a message and broadcasts it to all room members via Pusher.
   * Updates delivery status, seen status, and room's last message across all related channels.
   */
  async sendLiveMessage(data: IMessage) {
    try {
      await connectToDatabase();
      const room = await Room.findById(data.room).populate("members", [
        "avatar",
        "_id",
        "status",
        "name",
      ]);

      if (!room) {
        throw new Error("Room not found");
      }

      const deliveredTo = room.members
        .filter((m) => m._id.toString() !== data.sender.toString())
        .map((m) => m._id);

      const message = await Message.create({
        ...data,
        status: {
          deliveredTo: deliveredTo,
          seenBy: [data.sender],
        },
      });

      await Room.updateOne({ _id: room._id }, { lastMessage: message._id });

      const lastMessage = await Message.findById(message._id)
        .populate("sender", ["name", "avatar"])
        .lean();

      const populatedMessage = await Message.findById(message._id)
        .populate("sender", ["name", "avatar"])
        .populate("status.seenBy", ["name", "avatar", "_id"])
        .lean();

      if (!populatedMessage) {
        throw new Error("Failed to retrieve created message");
      }

      const channelName = `presence-chat-${data.room}`;
      await pusherServer.trigger(channelName, "new-message", populatedMessage);

      if (room.members && room.members.length > 0) {
        const roomContentData = {
          _id: room._id.toString(),
          members: room.members as unknown as RoomMembers[],
          name: room.isPrivate ? undefined : room.name,
          description: room.isPrivate ? undefined : room.description,
          lastMessage,
          isPrivate: room.isPrivate,
          image: room.isPrivate ? undefined : room.image,
        };

        await Promise.all(
          (room.members as unknown as RoomMembers[]).map((member) =>
            pusherServer.trigger(
              `user-${member._id.toString()}`,
              "room-updated",
              roomContentData,
            ),
          ),
        );
      }

      if (room.isPrivate && room.invitedUser && room.isPending) {
        const invitedUserId = room.invitedUser.toString();

        const invitedRoom = await roomService.getSinglePendingInvite(
          room._id.toString(),
        );

        await pusherServer.trigger(
          `user-${invitedUserId}`,
          "room-invite-last-message-updated",
          invitedRoom,
        );
      }

      const response = await pusherServer.get({
        path: `/channels/${channelName}/users`,
      });

      const { users }: { users: { id: string }[] } = await response.json();
      const onlineUserIds = users.map((u) => u.id);

      const onlineUsers = await User.find(
        { _id: { $in: onlineUserIds } },
        { avatar: 1, name: 1 },
      ).lean();

      if (onlineUserIds.length > 0) {
        await Message.updateOne(
          { _id: message._id },
          { $addToSet: { "status.seenBy": { $each: onlineUserIds } } },
        );

        await pusherServer.trigger(channelName, "update-seen-by", {
          messageId: message._id,
          seenBy: onlineUsers,
          deliveredTo,
        });
      }

      return populatedMessage;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Edits a message and broadcasts the update to all room members.
   * Updates the room's last message if the edited message is the most recent one.
   */
  async editLiveMessage(id: string, content: string) {
    try {
      await connectToDatabase();
      const editMessage = await Message.findOneAndUpdate(
        { _id: id },
        { content: content, isEdited: true },
        { new: true },
      );

      if (!editMessage) {
        return new Error("Message not found");
      }

      await editMessage.save();

      const newEditedMessage = await Message.findById(editMessage._id)
        .populate("sender", ["name", "avatar"])
        .lean();

      const channelName = `presence-chat-${editMessage.room}`;
      await pusherServer.trigger(channelName, "edit-message", newEditedMessage);

      const room = await Room.findById(editMessage.room).populate("members", [
        "avatar",
        "_id",
        "status",
        "name",
      ]);

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

      if (room?.isPrivate && room?.invitedUser && room?.isPending) {
        const invitedUserId = room.invitedUser.toString();

        const invitedRoom = await roomService.getSinglePendingInvite(
          room._id.toString(),
        );

        await pusherServer.trigger(
          `user-${invitedUserId}`,
          "room-invite-last-message-updated",
          invitedRoom,
        );
      }

      return newEditedMessage;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Deletes a message and broadcasts the deletion to all room members.
   * Updates the room's last message to the next most recent message.
   */
  async deleteLiveMessage(id: string) {
    try {
      if (!id) throw new Error("Message ID is required");

      await connectToDatabase();

      const message = await Message.findByIdAndDelete(id);

      const lastMessage = await Message.findOne({ room: message?.room }).sort({
        createdAt: -1,
      });

      if (lastMessage) {
        await Room.updateOne(
          { _id: message?.room },
          { lastMessage: lastMessage._id },
        );
        await lastMessage.save();
      }

      const channelName = `presence-chat-${message?.room}`;
      await pusherServer.trigger(channelName, "delete-message", message);

      const room = await Room.findById(message?.room).populate("members", [
        "avatar",
        "_id",
        "status",
        "name",
      ]);

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

      if (room?.isPrivate && room?.invitedUser && room?.isPending) {
        const invitedUserId = room.invitedUser.toString();

        const invitedRoom = await roomService.getSinglePendingInvite(
          room._id.toString(),
        );

        await pusherServer.trigger(
          `user-${invitedUserId}`,
          "room-invite-last-message-updated",
          invitedRoom,
        );
      }

      return message;
    } catch (error) {
      throw error;
    }
  },

  async findRoomById(id: string) {
    await connectToDatabase();
    const room = await Room.findById(id)
      .populate("members", ["name", "avatar", "_id", "status"])
      .populate("lastMessage", ["content", "type", "createdAt"])
      .lean();

    return room;
  },

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
