import mongoose, { Types, Schema } from "mongoose";

export interface IRoom {
  name?: string;
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
    name: { type: String, required: false },
    description: { type: String },
    isPrivate: { type: Boolean, default: false },
    members: [{ type: String, ref: "User", required: true }],
    image: { type: String },
    lastMessage: { type: Schema.Types.ObjectId, ref: "Message" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
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

// Delete the model if it exists to avoid OverwriteModelError
if (mongoose.models.Room) {
  delete mongoose.models.Room;
}

const Room = mongoose.model<IRoom>("Room", RoomSchema);

export default Room;
