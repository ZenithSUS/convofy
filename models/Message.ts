import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMessage extends Document {
  room: Types.ObjectId;
  sender: Types.ObjectId;
  content: string;
  type: "text" | "image" | "file";
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    room: { type: Schema.Types.ObjectId, ref: "Room", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    type: { type: String, enum: ["text", "image", "file"], default: "text" },
  },
  { timestamps: true },
);

export default mongoose.models.Message ||
  mongoose.model<IMessage>("Message", MessageSchema);
