import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMessage extends Document {
  room: Types.ObjectId;
  sender: Types.ObjectId;
  content: string;
  type: "text" | "image" | "file";
  isEdited: boolean;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    room: { type: Schema.Types.ObjectId, ref: "Room", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    isEdited: { type: Boolean, default: false, required: false },
    type: { type: String, enum: ["text", "image", "file"], default: "text" },
  },
  { timestamps: true },
);

MessageSchema.index({ content: "text" });

// Delete the model if it exists to avoid OverwriteModelError
if (mongoose.models.Message) {
  delete mongoose.models.Message;
}

const Message = mongoose.model<IMessage>("Message", MessageSchema);

export default Message;
