export type Room = {
  _id: string;
  name: string;
  description: string;
  members: { userId: string; username: string; role: "admin" | "member" }[];
  createdAt: string;
  updatedAt: string;
};
