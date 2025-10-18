import mongoose, { Schema, Document, Types } from "mongoose";

export interface IFriend extends Document {
  requester: Types.ObjectId; // who sent the request
  recipient: Types.ObjectId; // who received the request
  status: "pending" | "accepted" | "blocked";
  createdAt: Date;
  updatedAt: Date;
}

const FriendSchema = new Schema<IFriend>(
  {
    requester: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "blocked"],
      default: "pending",
    },
  },
  { timestamps: true },
);

FriendSchema.index({ requester: 1, recipient: 1 }, { unique: true }); // prevent duplicates

export default mongoose.models.Friend ||
  mongoose.model<IFriend>("Friend", FriendSchema);
