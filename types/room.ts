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
  createdBy: string;
  createdAt: Date;
};

export type CreateRoom = Omit<Room, "_id">;
