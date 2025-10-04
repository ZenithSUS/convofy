import { Types } from "mongoose";

export type Message = {
  _id: string;
  room: string;
  sender: {
    _id: Types.ObjectId | string;
    name: string;
  };
  content: string;
  type: "text" | "image" | "file";
  createdAt: Date;
};

export type CreateMessage = Omit<Message, "_id" | "createdAt" | "sender"> & {
  sender: string;
};
