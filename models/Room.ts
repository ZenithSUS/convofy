import mongoose, { Types, Schema } from "mongoose";

export interface IRoom {
  name: string;
  description?: string;
  isPrivate: boolean;
  image?: string;
  members: string[];
  lastMessage: Types.ObjectId;
  createdBy: Types.ObjectId;
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
).index({ name: "text", description: "text" });

// Delete the model if it exists to avoid OverwriteModelError
if (mongoose.models.Room) {
  delete mongoose.models.Room;
}

const Room = mongoose.model<IRoom>("Room", RoomSchema);

export default Room;
