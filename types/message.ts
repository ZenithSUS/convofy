import { Types } from "mongoose";
import { User } from "@/types/user";
import { RoomMembers } from "./room";

export type Message = {
  _id: string;
  room: string;
  sender: {
    _id: Types.ObjectId | string;
    name: string;
    avatar: string;
  };
  isEdited?: boolean;
  content: string;
  type: "text" | "image" | "file";
  createdAt: Date;
};

export type UserMessage = Message & {
  room: {
    name: string;
    isPrivate: boolean;
    members: RoomMembers[];
    avatar: string;
  };
};

export type MediaMessage = Omit<Message, "type"> & {
  type: "image" | "file";
};

export type CreateMessage = Omit<Message, "_id" | "createdAt" | "sender"> & {
  sender: string;
};

export type MessageTyping = {
  roomId: string;
  user: Omit<User, "_id" | "activeSessions"> & { id: string };
  isTyping: boolean;
};
