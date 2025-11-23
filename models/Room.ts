import { Message as MessageType } from "@/types/message";
import mongoose, { Types, Schema } from "mongoose";
import Message from "./Message";

export interface IRoom {
  _id: Types.ObjectId;
  name?: string;
  description?: string;
  isPrivate: boolean;
  isAccepted?: boolean;
  isPending?: boolean;
  invitedBy?: Types.ObjectId;
  invitedUser?: Types.ObjectId;
  image?: string;
  members: Types.ObjectId[];
  lastMessage: Types.ObjectId;
  owner: Types.ObjectId;
  createdAt: Date;
  isAnonymous: boolean;
}

const RoomSchema = new Schema<IRoom>(
  {
    name: { type: String, required: false },
    description: { type: String },
    isPrivate: { type: Boolean, default: false },
    isAccepted: { type: Boolean, default: false },
    isPending: { type: Boolean, default: false },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User" },
    invitedUser: { type: Schema.Types.ObjectId, ref: "User" },
    members: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    image: { type: String },
    lastMessage: { type: Schema.Types.ObjectId, ref: "Message" },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
    isAnonymous: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Text index for search
RoomSchema.index({ name: "text", description: "text" });

// Index for finding pending invitations
RoomSchema.index({ invitedUser: 1, isPending: 1 });

// Create a unique sparse index on the sorted members array for private rooms only
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
  if (this.members && this.members.length > 0) {
    this.members = [...this.members].sort();
  }

  // Set isPending to true for new private rooms
  if (this.isNew && this.isPrivate && !this.isAccepted) {
    this.isPending = true;
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
