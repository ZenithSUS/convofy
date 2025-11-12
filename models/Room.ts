import { Message as MessageType } from "@/types/message";
import mongoose, { Types, Schema } from "mongoose";
import Message from "./Message";

export interface IRoom {
  name?: string;
  description?: string;
  isPrivate: boolean;
  image?: string;
  members: Types.ObjectId[];
  lastMessage: Types.ObjectId;
  owner: Types.ObjectId;
  createdAt: Date;
}

const RoomSchema = new Schema<IRoom>(
  {
    name: { type: String, required: false },
    description: { type: String },
    isPrivate: { type: Boolean, default: false },
    members: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    image: { type: String },
    lastMessage: { type: Schema.Types.ObjectId, ref: "Message" },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Text index for search
RoomSchema.index({ name: "text", description: "text" });

// Create a unique sparse index on the sorted members array for private rooms only
// This prevents duplicate private rooms with the same members
RoomSchema.index(
  { members: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: {
      isPrivate: true,
      members: { $exists: true, $type: "array" },
    },
  },
);

// Sort members to ensure consistent ordering
RoomSchema.pre("save", function (next) {
  // Sort members to ensure consistent ordering
  if (this.members && this.members.length > 0) {
    this.members = [...this.members].sort();
  }
  next();
});

// Cascade delete messages if the room is deleted
RoomSchema.post("findOneAndDelete", async (doc: MessageType) => {
  await Message.deleteMany({ room: doc.room });
});

RoomSchema.post("deleteOne", async function () {
  const roomId = this.getFilter()["_id"];
  await Message.deleteMany({ room: roomId });
});

RoomSchema.post("deleteMany", async function () {
  const roomId = this.getFilter()["_id"];
  await Message.deleteMany({ room: roomId });
});

// Delete the model if it exists to avoid OverwriteModelError
if (mongoose.models.Room) {
  delete mongoose.models.Room;
}

const Room = mongoose.model<IRoom>("Room", RoomSchema);

export default Room;
