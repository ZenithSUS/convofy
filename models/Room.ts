import mongoose, { Types, Schema } from "mongoose";

export interface IRoom {
  name: string;
  description?: string;
  isPrivate: boolean;
  image?: string;
  members: string[]; // Array of User IDs
  lastMessage?: Types.ObjectId;
  createdBy: Types.ObjectId; // User ID
  createdAt: Date;
}

const RoomSchema = new Schema<IRoom>(
  {
    name: { type: String, required: true },
    description: { type: String },
    isPrivate: { type: Boolean, default: false },
    members: [{ type: String, ref: "User" }],
    image: { type: String },
    lastMessage: { type: Schema.Types.ObjectId, ref: "Message" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default mongoose.models.Room ||
  mongoose.model<IRoom>("Room", RoomSchema);
