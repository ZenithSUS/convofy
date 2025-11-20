export type LastRoomMessage = {
  _id: string;
  room: string;
  sender: string;
  content: string;
  type: "text" | "image" | "file";
  isEdited: boolean;
  status: {
    deliveredTo: string[];
    seenBy: string[];
  };
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
  status?: "online" | "offline";
};

export type RoomContent = Omit<Room, "members" | "lastMessage"> & {
  members: RoomMembers[];
  type: "room" | "user";
  avatar?: string;
  lastMessage: Omit<LastRoomMessage, "status"> & {
    status: {
      seenBy: string[];
    };
  };
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

export type Seen = {
  _id: string;
  name: string;
  avatar: string;
};
