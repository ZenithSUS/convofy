import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // optional if using OAuth
  avatar?: string;
  status: "online" | "offline";
  providers: string[];
  lastActive?: Date;
  createdAt: Date;
  isAnonymous?: boolean;
  anonAlias?: string | null;
  anonAvatar?: string | null;
  linkedAccounts: {
    provider: "credentials" | "google" | "github" | "facebook";
    providerAccountId: string;
  }[];
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Will be undefined for OAuth-only users
    avatar: { type: String },
    status: { type: String, enum: ["online", "offline"], default: "offline" },
    providers: {
      type: [String],
      default: [],
      enum: ["credentials", "google", "github", "facebook"],
    },
    lastActive: { type: Date },
    isAnonymous: { type: Boolean, default: false },
    anonAlias: { type: String },
    anonAvatar: { type: String },
    linkedAccounts: [
      {
        provider: {
          type: String,
          enum: ["credentials", "google", "github", "facebook"],
          required: true,
        },
        providerAccountId: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
