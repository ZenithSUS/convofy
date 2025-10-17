import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // optional if using OAuth
  avatar?: string;
  status: "online" | "offline";
  lastActive?: Date;
  createdAt: Date;
  isAnonymous?: boolean;
  anonAlias?: string;
  anonAvatar?: string | null;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    avatar: { type: String },
    status: { type: String, enum: ["online", "offline"], default: "offline" },
    lastActive: { type: Date },
    isAnonymous: { type: Boolean, default: false },
    anonAlias: { type: String },
    anonAvatar: { type: String },
  },
  { timestamps: true },
);

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
