import { Types } from "mongoose";

export type LastRoomMessage = {
  _id: Types.ObjectId | string;
  room: Types.ObjectId | string;
  sender: Types.ObjectId | string;
  content: string;
  type: "text" | "image" | "file";
  createdAt: Date;
};

export type Room = {
  _id: string;
  name: string;
  description: string;
  image?: string;
  members: string[];
  lastMessage?: LastRoomMessage;
  isPrivate: boolean;
  isAccepted?: boolean;
  isPending?: boolean;
  invitedBy?: {
    _id: string;
    name: string;
    avatar: string;
  };
  invitedUser?: string;
  owner: string;
  createdAt: Date;
};

export type RoomMembers = {
  _id: string;
  name: string;
  avatar: string;
  isAvailable: boolean;
};

export type RoomContent = Omit<Room, "members"> & {
  members: RoomMembers[];
  type: "room" | "user";
  avatar?: string;
};

export type RoomRequest = Omit<
  Room,
  | "description"
  | "members"
  | "owner"
  | "isAccepted"
  | "isPending"
  | "lastMessage"
> & {
  lastMessage: LastRoomMessage;
};

export type CreateRoom = Omit<Room, "_id">;
