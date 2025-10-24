export type User = {
  _id: string;
  name: string;
  password?: string;
  email: string;
  avatar: string;
  status: "online" | "offline";
  lastActive: Date;
  createdAt: Date;
};

export type UserMediaDataStats = {
  messages: number;
  medias: number;
  contacts: number;
};

export type UserMessageDataStats = {
  messages: number;
  nonTextMessages: number;
  editedMessages: number;
};
