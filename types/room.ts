import { Types } from "mongoose";

export type Room = {
  _id: string;
  name: string;
  description: string;
  image?: string;
  members: string[];
  lastMessage?: {
    _id: Types.ObjectId | string;
    room: Types.ObjectId | string;
    sender: Types.ObjectId | string;
    content: string;
    type: "text" | "image" | "file";
    createdAt: Date;
  };
  isPrivate: boolean;
  createdBy: string;
  createdAt: Date;
};

export type RoomMembers = {
  _id: string;
  name: string;
  avatar: string;
};

export type RoomContent = Omit<Room, "members"> & {
  members: RoomMembers[];
  type: "room" | "user";
  avatar?: string;
};

export type CreateRoom = Omit<Room, "_id">;
