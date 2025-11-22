import { Types } from "mongoose";
import { User } from "@/types/user";
import { RoomMembers } from "./room";

export type Sender = {
  _id: Types.ObjectId | string;
  name: string;
  avatar: string;
  isAnonymous: boolean;
  anonAvatar?: string;
  anonAlias?: string;
};

export type Message = {
  _id: string;
  room: {
    _id: string;
    isAnonymous: boolean;
  };
  sender: Sender;
  isEdited?: boolean;
  content: string;
  type: "text" | "image" | "file";
  status: {
    deliveredTo: string[];
    seenBy: {
      _id: string;
      name: string;
      avatar: string | null;
      isAnonymous: boolean;
      anonAvatar?: string;
      anonAlias?: string;
      role: "user" | "anonymous" | "admin";
    }[];
  };
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

export type CreateMessage = Omit<
  Message,
  "_id" | "createdAt" | "sender" | "status" | "room"
> & {
  room: string;
  sender: string;
};

export type MessageTyping = {
  roomId: string;
  user: Omit<User, "_id" | "activeSessions"> & { id: string };
  isTyping: boolean;
};

export type MessageOutputTyping = {
  user: {
    _id: string;
    name: string;
    avatar: string | null;
  };
};

export type NewSeenMessage = {
  messageId: string;
  seenBy: {
    _id: string;
    name: string;
    avatar: string | null;
    isAnonymous: boolean;
    anonAvatar?: string;
    anonAlias?: string;
    role: "user" | "anonymous" | "admin";
  }[];
  deliveredTo: string[];
};
